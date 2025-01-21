import React from 'react'
import { Box } from '@mui/material'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { Resume } from '../types/Resume'
import { useResumeStore } from '../stores/useResumeStore'

interface DeleteDialogState {
  type: 'experience'
  index: number
  title: string
}

const Editor = () => {
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteDialogState | null>(null)
  const updateResume = useResumeStore(state => state.updateResume)

  const handleUpdate = (updater: (resume: Resume) => Resume) => {
    const resume = useResumeStore.getState().resume
    if (resume) {
      const updated = updater(resume)
      updateResume(updated)
    }
  }

  return (
    <Box>
      <DeleteConfirmDialog
        open={!!deleteDialog}
        title={`Delete ${deleteDialog?.title}?`}
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={() => {
          if (deleteDialog) {
            handleUpdate((r: Resume) => ({
              ...r,
              experience: r.experience.filter((_, i: number) => i !== deleteDialog.index)
            }))
            setDeleteDialog(null)
          }
        }}
        onCancel={() => setDeleteDialog(null)}
      />
    </Box>
  )
}

export default Editor 