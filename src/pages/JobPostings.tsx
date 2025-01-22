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

import { useState, useEffect } from 'react';
import { useJobPostingStore } from '../stores/useJobPostingStore';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, CircularProgress, Container } from '@mui/material';
import type { JobPosting } from '../types/JobPosting';
import { JobPostEditor } from '../components/JobPostEditor';
import { MenuBar } from '../components/MenuBar';

export function JobPostings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPosting, setNewPosting] = useState<Partial<JobPosting>>({});
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  
  const { postings, createPosting, isLoading, error, selectedRepo, loadPostings, setSelectedPosting: setStoreSelectedPosting } = useJobPostingStore();

  useEffect(() => {
    if (selectedRepo) {
      loadPostings();
    }
  }, [selectedRepo]);

  const handleSelectPosting = (posting: JobPosting | null) => {
    setSelectedPosting(posting);
    setStoreSelectedPosting(posting);
  };

  const handleCreate = async () => {
    if (!newPosting.company || !newPosting.title || !newPosting.url || !newPosting.rawText) {
      return;
    }

    try {
      const id = formatId(newPosting.company, newPosting.title);
      await createPosting({
        id,
        company: newPosting.company,
        title: newPosting.title,
        url: newPosting.url,
        rawText: newPosting.rawText
      });
      setIsDialogOpen(false);
      setNewPosting({});
    } catch (error) {
      console.error('Failed to create posting:', error);
    }
  };

  const formatId = (company: string, title: string): string => {
    const date = new Date().toISOString().split('T')[0];
    const slug = `${company}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${date}-${slug}`;
  };

  if (!selectedRepo) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Please select a repository first</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (selectedPosting) {
    return (
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.paper',
        zIndex: 1200 
      }}>
        <JobPostEditor 
          onClose={() => handleSelectPosting(null)} 
        />
      </Box>
    );
  }

  return (
    <>
      <MenuBar />
      <Container maxWidth="lg">
        <Box p={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Job Postings</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setIsDialogOpen(true)}
              disabled={isLoading}
            >
              Add Job Posting
            </Button>
          </Box>
          
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

          {postings.length === 0 ? (
            <Typography sx={{ textAlign: 'center', mt: 4 }}>
              No job postings yet. Click "Add Job Posting" to create one.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {postings.map(posting => (
                <Button
                  key={posting.id}
                  variant="outlined"
                  color="primary"
                  onClick={() => handleSelectPosting(posting)}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  {posting.company} — {posting.title}
                </Button>
              ))}
            </Box>
          )}

          <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
            <DialogTitle>Add Job Posting</DialogTitle>
            <DialogContent>
              <TextField
                label="Company"
                value={newPosting.company || ''}
                onChange={e => setNewPosting(prev => ({ ...prev, company: e.target.value }))}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Title"
                value={newPosting.title || ''}
                onChange={e => setNewPosting(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
                margin="normal"
              />
              <TextField
                label="URL"
                value={newPosting.url || ''}
                onChange={e => setNewPosting(prev => ({ ...prev, url: e.target.value }))}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Job Description"
                value={newPosting.rawText || ''}
                onChange={e => setNewPosting(prev => ({ ...prev, rawText: e.target.value }))}
                fullWidth
                multiline
                rows={4}
                margin="normal"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} color="primary" disabled={isLoading}>
                Create
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </>
  );
} 