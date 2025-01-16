/*
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
import { Box, Button, Paper, Typography, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useExperienceConversationStore } from '../stores/useExperienceConversationStore';
import { useResumeStore } from '../stores/useResumeStore';
import type { Project, Resume, Anecdote } from '../types/Resume';
import Markdown from 'markdown-to-jsx'
import { EditableText } from '../components/EditableText';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Preview';
import { EditableMarkdown } from './EditableMarkdown';
import { AnecdoteAugmentation } from './AnecdoteAugmentation';

interface Props {
  project: Project;
  onClose: () => void;
}

export const ProjectConversation = ({ project, onClose }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const [summary, setSummary] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const { messages, suggestions, isLoading, addMessage, setSuggestions, setLoading, reset } = useExperienceConversationStore();
  const updateResume = useResumeStore(state => state.updateResume);
  const resume = useResumeStore(state => state.resume);

  // Use an additional state to track if we've already loaded suggestions
  const [hasLoaded, setHasLoaded] = useState(false);

  // Add state to track if conversation has started
  const hasConversationStarted = messages.length > 0;

  // Initialize project with anecdotes array if it doesn't exist
  useEffect(() => {
    if (!project.anecdotes && resume) {
      const updatedResume = { ...resume };
      updatedResume.projects = resume.projects.map(p => {
        if (p.name === project.name) {
          return { ...p, anecdotes: [] };
        }
        return p;
      });
      updateResume(updatedResume);
    }
  }, [project, resume]);

  // Initialize summary from existing anecdote if we're editing
  useEffect(() => {
    if (project.anecdotes?.length) {
      setSummary(project.anecdotes[0].content);
    }
  }, [project.anecdotes]);

  useEffect(() => {
    const generateSuggestions = async () => {
      // Don't fetch if we've already loaded suggestions for this project
      if (hasLoaded) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ project })
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
  }, [project, hasLoaded]);

  // Function to check if scrolled to bottom
  const isScrolledToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    
    const threshold = 50; // pixels from bottom to consider "at bottom"
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Monitor scroll position to determine if we should auto-scroll
  const handleScroll = () => {
    setShouldAutoScroll(isScrolledToBottom());
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    addMessage('user', content);
    setInputValue('');
    setLoading(true);
    scrollToBottom(); // Always scroll to bottom when user sends a message

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content }],
          project 
        })
      });
      const data = await response.json();
      addMessage('assistant', data.response);

      // Update summary after each message
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content }, { role: 'assistant', content: data.response }], project })
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
        const updatedProjects = currentResume.projects.map(proj => {
          if (proj.name === project.name && proj.url === project.url) {
            // If we're editing an existing anecdote, update it
            const existingAnecdoteIndex = proj.anecdotes?.findIndex(
              a => JSON.stringify(a.conversationContext?.messages) === JSON.stringify(messages)
            );
            
            if (existingAnecdoteIndex !== undefined && existingAnecdoteIndex >= 0) {
              const updatedAnecdotes = [...(proj.anecdotes || [])];
              updatedAnecdotes[existingAnecdoteIndex] = {
                ...updatedAnecdotes[existingAnecdoteIndex],
                content: summary,
                timestamp: new Date().toISOString()
              };
              return { ...proj, anecdotes: updatedAnecdotes };
            }
            
            // Otherwise create a new anecdote
            return {
              ...proj,
              anecdotes: [
                ...(proj.anecdotes || []),
                {
                  id: crypto.randomUUID(),
                  content: summary,
                  timestamp: new Date().toISOString(),
                  conversationContext: {
                    role: proj.name,
                    messages
                  }
                }
              ]
            };
          }
          return proj;
        });
        return { ...currentResume, projects: updatedProjects };
      };

      await updateResume(updatedResume(useResumeStore.getState().resume!));
      onClose();
    } catch (error) {
      console.error('Failed to save anecdote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestions = (type: 'description' | 'skills' | 'accomplishments', suggestions: string[]) => {
    if (!resume) return;

    const updatedResume = { ...resume };
    const projectToUpdate = updatedResume.projects.find(p => p.name === project.name);
    
    if (!projectToUpdate) return;

    switch (type) {
      case 'description':
        projectToUpdate.description = suggestions[0];
        break;
      case 'skills':
        projectToUpdate.skills = [...(projectToUpdate.skills || []), ...suggestions];
        break;
      case 'accomplishments':
        projectToUpdate.accomplishments = [...(projectToUpdate.accomplishments || []), ...suggestions];
        break;
    }

    updateResume(updatedResume);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{project.name}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Main content */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left pane - Summary */}
        <Box sx={{ width: '40%', p: 2, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" gutterBottom>Project Details</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Name:</Typography>
            <Typography>{project.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>URL:</Typography>
            <Typography>{project.url}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Description:</Typography>
            <Typography>{project.description}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Technologies:</Typography>
            <Typography>{project.technologies.join(', ')}</Typography>
          </Box>

          <Typography variant="subtitle1" gutterBottom>Summary</Typography>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <EditableMarkdown
              value={summary}
              onChange={setSummary}
            />
            {summary && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <AnecdoteAugmentation
                  experience={project}
                  type="description"
                  anecdote={summary}
                  onAccept={(suggestions) => handleAcceptSuggestions('description', suggestions)}
                />
                <AnecdoteAugmentation
                  experience={project}
                  type="skills"
                  anecdote={summary}
                  onAccept={(suggestions) => handleAcceptSuggestions('skills', suggestions)}
                />
                <AnecdoteAugmentation
                  experience={project}
                  type="accomplishments"
                  anecdote={summary}
                  onAccept={(suggestions) => handleAcceptSuggestions('accomplishments', suggestions)}
                />
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading || !summary}
            sx={{ mt: 2 }}
          >
            Save & Exit
          </Button>
        </Box>

        {/* Right pane - Conversation */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          {/* Messages area */}
          <Box 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            sx={{ flex: 1, overflow: 'auto', mb: 2 }}
          >
            {messages.map((msg, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {msg.role === 'user' ? (i === 0 ? 'Ice Breaker' : 'You') : 'AI'}:
                </Typography>
                <Box sx={{ 
                  '& p': { my: 1 },
                  '& ul, & ol': { my: 1, pl: 3 },
                  '& li': { my: 0.5 },
                  '& code': {
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: theme => theme.palette.mode === 'light' ? 'grey.200' : 'grey.800',
                    color: theme => theme.palette.mode === 'light' ? 'grey.900' : 'grey.100',
                    fontFamily: 'monospace'
                  }
                }}>
                  <Markdown>{msg.content}</Markdown>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} /> {/* Scroll anchor */}
            {isLoading && (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Thinking...
              </Typography>
            )}
          </Box>

          {/* Suggestions */}
          {!hasConversationStarted && suggestions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Conversation Starters:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => handleSendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {/* Input area */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button
              variant="contained"
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}; 