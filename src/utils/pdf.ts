import { jsPDF } from 'jspdf'
import { JobPosting } from '../types/JobPosting'
import { Resume, Experience } from '../types/Resume'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
})

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function getFullResume(selectedRepo: string): Promise<Resume> {
  const [owner, repo] = selectedRepo.split('/')
  const response = await octokit.repos.getContent({
    owner,
    repo,
    path: 'full-resume.xml'
  })

  if (!('content' in response.data)) {
    throw new Error('Invalid response from GitHub')
  }

  const xmlContent = atob(response.data.content)
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'text/xml')

  // Parse personal info
  const resume: Resume = {
    personalInfo: {
      name: doc.querySelector('name')?.textContent || '',
      address: doc.querySelector('address')?.textContent || '',
      phone: doc.querySelector('phone')?.textContent || '',
      email: doc.querySelector('email')?.textContent || '',
      description: doc.querySelector('description')?.textContent || ''
    },
    experience: [],
    projects: [],
    patents: []
  }

  // Parse experience
  doc.querySelectorAll('experience > job').forEach(job => {
    const experience: Experience = {
      company: job.querySelector('company')?.textContent || '',
      dates: job.querySelector('dates')?.textContent || '',
      positions: Array.from(job.querySelectorAll('positions > position')).map(pos => ({
        title: pos.textContent || '',
        startDate: pos.getAttribute('startDate') || '',
        endDate: pos.getAttribute('endDate') || ''
      })),
      skills: Array.from(job.querySelectorAll('skills > skill')).map(skill => skill.textContent || ''),
      description: job.querySelector('description')?.textContent || '',
      accomplishments: Array.from(job.querySelectorAll('accomplishments > item')).map(item => item.textContent || '')
    }
    resume.experience.push(experience)
  })

  // Parse projects
  doc.querySelectorAll('projects > project').forEach(proj => {
    resume.projects.push({
      name: proj.querySelector('name')?.textContent || '',
      url: proj.querySelector('url')?.textContent || '',
      description: proj.querySelector('description')?.textContent || '',
      technologies: Array.from(proj.querySelectorAll('technologies > tech')).map(tech => tech.textContent || '')
    })
  })

  // Parse patents
  doc.querySelectorAll('patents > patent').forEach(pat => {
    resume.patents.push({
      number: pat.querySelector('number')?.textContent || '',
      title: pat.querySelector('title')?.textContent || ''
    })
  })

  return resume
}

export async function generateAndSavePDF(posting: JobPosting, selectedRepo: string) {
  const resume = await getFullResume(selectedRepo)
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const lineHeight = 7

  // Helper to add wrapped text
  const addWrappedText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
    doc.text(lines, margin, y)
    return y + lines.length * lineHeight
  }

  // Helper to add a section header
  const addSectionHeader = (text: string, y: number) => {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    y = addWrappedText(text, y, 14)
    doc.setFont('helvetica', 'normal')
    return y + lineHeight
  }

  let y = margin

  // Add personal information
  y = addWrappedText(resume.personalInfo.name, y, 16) + lineHeight
  y = addWrappedText(resume.personalInfo.address, y) + lineHeight * 2

  // Add overview and closing from generated resume
  if (posting.generatedResume) {
    const [overview, closing] = posting.generatedResume.split('\n\n')
    
    y = addSectionHeader('Overview', y)
    y = addWrappedText(overview, y) + lineHeight * 2

    // Add experience
    y = addSectionHeader('Experience', y)
    for (const job of resume.experience) {
      y = addWrappedText(job.company, y, 13)
      for (const pos of job.positions) {
        y = addWrappedText(`${pos.title} (${pos.startDate} - ${pos.endDate})`, y, 11)
      }
      y = addWrappedText(job.description, y) + lineHeight
      for (const acc of job.accomplishments) {
        y = addWrappedText(`• ${acc}`, y) + lineHeight
      }
      y += lineHeight
    }

    // Add projects
    y = addSectionHeader('Open Source Projects', y)
    for (const project of resume.projects) {
      y = addWrappedText(project.name, y, 13)
      if (project.url) {
        doc.setTextColor(0, 0, 255)
        y = addWrappedText(project.url, y, 10)
        doc.setTextColor(0)
      }
      y = addWrappedText(project.description, y) + lineHeight
      y = addWrappedText(`Technologies: ${project.technologies.join(', ')}`, y, 10) + lineHeight
    }

    // Add patents
    y = addSectionHeader('Patents', y)
    for (const patent of resume.patents) {
      y = addWrappedText(`${patent.title} (Patent #${patent.number})`, y) + lineHeight
    }
    y += lineHeight

    // Add closing
    y = addSectionHeader('Closing', y)
    y = addWrappedText(closing, y) + lineHeight
  }

  // Convert PDF to base64
  const pdfOutput = doc.output('arraybuffer')
  const base64PDF = arrayBufferToBase64(pdfOutput)

  // Save to GitHub
  const [owner, repo] = selectedRepo.split('/')
  const path = `job-postings/${posting.id}.pdf`

  try {
    // Check if file exists
    try {
      const existingFile = await octokit.repos.getContent({
        owner,
        repo,
        path
      })
      
      if ('sha' in existingFile.data) {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: `Update resume for ${posting.company} - ${posting.title}`,
          content: base64PDF,
          sha: existingFile.data.sha,
          branch: 'main'
        })
      }
    } catch (error: any) {
      if (error.status === 404) {
        // File doesn't exist, create it
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: `Add resume for ${posting.company} - ${posting.title}`,
          content: base64PDF,
          branch: 'main'
        })
      } else {
        throw error
      }
    }

    return path
  } catch (error) {
    console.error('Failed to save PDF:', error)
    throw new Error('Failed to save PDF to GitHub')
  }
} 