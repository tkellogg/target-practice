/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { useState } from 'react';
import { useJobPostingStore } from '../stores/useJobPostingStore';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import type { JobPosting } from '../types/JobPosting';

export function JobPostings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPosting, setNewPosting] = useState<Partial<JobPosting>>({});
  
  const { postings, createPosting, isLoading, error } = useJobPostingStore();

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

  return (
    <div>
      <h2>Job Postings</h2>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setIsDialogOpen(true)}
        disabled={isLoading}
      >
        Add Job Posting
      </Button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {postings.map(posting => (
          <li key={posting.id}>
            <h3>{posting.title}</h3>
            <p>{posting.company}</p>
            <a href={posting.url} target="_blank" rel="noopener noreferrer">View Job</a>
            {posting.generatedResume && (
              <div>
                <h4>Generated Resume</h4>
                <pre>{posting.generatedResume}</pre>
              </div>
            )}
          </li>
        ))}
      </ul>

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
    </div>
  );
} 