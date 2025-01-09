import { AppBar, Toolbar, Button, Box } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { useResumeStore } from '../stores/useResumeStore'

export const MenuBar = () => {
  const { resume, updateResume } = useResumeStore()

  const handleSave = () => {
    if (resume) {
      updateResume(resume)
    }
  }

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!resume}
        >
          Save
        </Button>
      </Toolbar>
    </AppBar>
  )
} 