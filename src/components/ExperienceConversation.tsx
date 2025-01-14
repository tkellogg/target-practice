/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore';
import { useResumeStore } from '../stores/useResumeStore';
import type { Experience, Resume } from '../types/Resume';
import Markdown from 'markdown-to-jsx'
import { EditableText } from '../components/EditableText';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Preview';
import { EditableMarkdown } from './EditableMarkdown';

interface Props {
  experience: Experience;
  onClose: () => void;
}

export const ExperienceConversation = ({ experience, onClose }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const [summary, setSummary] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const { messages, suggestions, isLoading, addMessage, setSuggestions, setLoading, reset } = useExperienceConversationStore();
  const updateResume = useResumeStore(state => state.updateResume);

  // Use an additional state to track if we've already loaded suggestions
  const [hasLoaded, setHasLoaded] = useState(false);

  // Add state to track if conversation has started
  const hasConversationStarted = messages.length > 0;

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

  useEffect(() => {
    const generateSuggestions = async () => {
      // Don't fetch if we've already loaded suggestions for this experience
      if (hasLoaded) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ experience })
        });

        const data = await response.json();
        setSuggestions(data.suggestions);
        setHasLoaded(true);
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [experience, hasLoaded]); // Add hasLoaded to dependencies

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    addMessage('user', content);
    setInputValue('');
    setLoading(true);

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
        body: JSON.stringify({ messages: [...messages, { role: 'user', content }, { role: 'assistant', content: data.response }], experience })
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
            // If we're editing an existing anecdote, update it
            const existingAnecdoteIndex = exp.anecdotes?.findIndex(
              a => JSON.stringify(a.conversationContext?.messages) === JSON.stringify(messages)
            );
            
            if (existingAnecdoteIndex !== undefined && existingAnecdoteIndex >= 0) {
              const updatedAnecdotes = [...(exp.anecdotes || [])];
              updatedAnecdotes[existingAnecdoteIndex] = {
                ...updatedAnecdotes[existingAnecdoteIndex],
                content: summary,
                timestamp: new Date().toISOString()
              };
              return { ...exp, anecdotes: updatedAnecdotes };
            }
            
            // Otherwise create a new anecdote
            return {
              ...exp,
              anecdotes: [
                ...(exp.anecdotes || []),
                {
                  id: crypto.randomUUID(),
                  content: summary,
                  timestamp: new Date().toISOString(),
                  conversationContext: {
                    role: experience.positions[0].title,
                    messages
                  }
                }
              ]
            };
          }
          return exp;
        });
        return { ...currentResume, experience: updatedExperience };
      };

      await updateResume(updatedResume(useResumeStore.getState().resume!));
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Expand Experience Details</Typography>
        <IconButton onClick={() => { reset(); onClose(); }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left pane - Experience context and Summary */}
        <Box sx={{ 
          flex: 1, 
          borderRight: 1, 
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          {/* Experience Context */}
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

          {/* Summary Section */}
          <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" gutterBottom>
              Summary:
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <EditableMarkdown
                value={summary}
                onChange={setSummary}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleSaveAndExit}
                disabled={!summary || isLoading}
                sx={{ mt: 2 }}
              >
                Save & Exit
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Right pane - Conversation */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          {/* Messages area */}
          <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {msg.role === 'user' ? 'You' : 'AI'}:
                </Typography>
                {msg.role === 'user' ? (
                  <Typography variant="body1">{msg.content}</Typography>
                ) : (
                  <Box sx={{ 
                    '& p': { my: 1 },
                    '& ul, & ol': { my: 1, pl: 3 },
                    '& li': { my: 0.5 },
                    '& code': {
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: 'grey.100',
                      fontFamily: 'monospace'
                    }
                  }}>
                    <Markdown>{msg.content}</Markdown>
                  </Box>
                )}
              </Box>
            ))}
            {isLoading && (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Thinking...
              </Typography>
            )}
          </Box>

          {/* Only show suggestions if conversation hasn't started */}
          {suggestions.length > 0 && !hasConversationStarted && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Questions:
              </Typography>
              {suggestions.map((suggestion, i) => (
                <Button 
                  key={i}
                  variant="outlined" 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }}
                  onClick={() => handleSendMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </Box>
          )}

          {/* Input area */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              sx={{ flex: 1 }}
              disabled={isLoading}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}; 