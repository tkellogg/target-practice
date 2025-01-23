/**
 * Copyright 2025 Tim Kellogg
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useRef } from 'react';
import { Box, Button, Paper, Typography, IconButton, TextField, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore';
import { useResumeStore } from '../stores/useResumeStore';
import type { Experience, Resume } from '../types/Resume';
import Markdown from 'markdown-to-jsx'
import { EditableText } from '../components/EditableText';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { EditableMarkdown } from './EditableMarkdown';

interface Props {
  experience: Experience;
  onClose: () => void;
}

export const ExperienceConversation = ({ experience, onClose }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const [summary, setSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const { messages, suggestions, isLoading, addMessage, setSuggestions, setLoading, reset } = useExperienceConversationStore();
  const updateResume = useResumeStore(state => state.updateResume);

  // Initialize summary from existing anecdote if we're editing
  useEffect(() => {
    if (messages.length > 0) {
      const existingAnecdote = experience.anecdotes?.find(
        a => JSON.stringify(a.conversationContext?.messages) === JSON.stringify(messages)
      );
      if (existingAnecdote) {
        setSummary(existingAnecdote.content);
      }
    }
  }, [messages, experience.anecdotes]);

  // Load conversation starters when component mounts
  useEffect(() => {
    const generateSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience })
        });
        const data = await response.json();
        setSuggestions(data.suggestions);
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [experience]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    addMessage('user', content);
    setInputValue('');
    setLoading(true);
    scrollToBottom();

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content }],
          experience 
        })
      });
      const data = await response.json();
      addMessage('assistant', data.response);

      // Update summary after each message
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content }, { role: 'assistant', content: data.response }],
          experience 
        })
      });
      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedResume = (currentResume: Resume): Resume => {
        const updatedExperience = currentResume.experience.map(exp => {
          if (exp.company === experience.company) {
            return {
              ...exp,
              anecdotes: [
                {
                  id: crypto.randomUUID(),
                  content: summary,
                  timestamp: new Date().toISOString(),
                  conversationContext: {
                    role: experience.positions[0].title,
                    messages
                  }
                },
                ...(exp.anecdotes || [])
              ]
            };
          }
          return exp;
        });
        return { ...currentResume, experience: updatedExperience };
      };

      await updateResume(updatedResume(useResumeStore.getState().resume!));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save anecdote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    reset();
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Expand Experience Details</Typography>
        <IconButton onClick={() => { reset(); onClose(); }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Main content */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left pane - Experience and Summary */}
        <Box sx={{ 
          width: '40%', 
          borderRight: 1, 
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          {/* Experience section */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" gutterBottom>
              {experience.company}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {experience.positions[0].title}
            </Typography>
            <Typography variant="body2">
              {experience.description}
            </Typography>
          </Box>

          {/* Summary section */}
          <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Summary:</Typography>
              <Box>
                {isEditing ? (
                  <IconButton onClick={handleSave} disabled={isLoading}>
                    <SaveIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => setIsEditing(true)}>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
            {isEditing ? (
              <EditableText
                value={summary}
                onChange={setSummary}
                multiline
                sx={{ width: '100%' }}
              />
            ) : (
              <Typography variant="body2">{summary}</Typography>
            )}
          </Box>

          {/* Save & Exit button */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="contained"
              onClick={handleSaveAndExit}
              disabled={isLoading}
              fullWidth
            >
              Save & Exit
            </Button>
          </Box>
        </Box>

        {/* Right pane - Conversation */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Conversation starters */}
          {!messages.length && suggestions.length > 0 && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Questions:
              </Typography>
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSendMessage(suggestion)}
                  sx={{ mr: 1, mb: 1 }}
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </Box>
          )}

          {/* Messages */}
          <Box 
            ref={messagesContainerRef}
            sx={{ 
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {messages.map((message, index) => (
              <Box 
                key={index}
                sx={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <Paper 
                  elevation={1}
                  sx={{ 
                    p: 2,
                    bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper'
                  }}
                >
                  <Markdown>{message.content}</Markdown>
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    Send
                  </Button>
                )
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}; 