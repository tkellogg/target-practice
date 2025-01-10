import { useJobPostingStore } from '../stores/useJobPostingStore'
import { useResumeStore } from '../stores/useResumeStore'
import type { Resume } from '../types/Resume'

export function JobPostings() {
  const {
    selectedPosting,
    setSelectedRepo,
    loadPostings,
    generateResume,
    generateSuggestions,
    isLoading,
    error
  } = useJobPostingStore()

  const { resume } = useResumeStore()

  const handleGenerate = async () => {
    if (!selectedPosting || !resume) return
    
    try {
      await generateResume(selectedPosting, resume)
      await generateSuggestions(selectedPosting)
    } catch (error) {
      console.error('Failed to generate:', error)
    }
  } 
} 