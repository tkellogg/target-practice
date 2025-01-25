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

import { jsPDF } from 'jspdf'
import { JobPosting } from '../types/JobPosting'
import { Resume } from '../types/Resume'
import { Octokit } from '@octokit/rest'
import { parseRepoString } from './github'
import { useResumeStore } from '../stores/useResumeStore'

const octokit = new Octokit({
  auth: import.meta.env.VITE_GH_ACCESS_KEY
})

// Load custom fonts
async function loadFonts(doc: jsPDF) {
  try {
    const robotoRegular = await fetch('/fonts/Roboto-Regular.ttf').then(r => r.arrayBuffer())
    const robotoBold = await fetch('/fonts/Roboto-Bold.ttf').then(r => r.arrayBuffer())
    // const inter = await fetch('/fonts/Inter-VariableFont_opsz,wght.ttf').then(r => r.arrayBuffer())
    // const merriweather = await fetch('/fonts/Merriweather-Regular.ttf').then(r => r.arrayBuffer())
    
    doc.addFileToVFS('Roboto-Regular.ttf', arrayBufferToBase64(robotoRegular))
    doc.addFileToVFS('Roboto-Bold.ttf', arrayBufferToBase64(robotoBold))
    // doc.addFileToVFS('Inter.ttf', arrayBufferToBase64(inter))
    // doc.addFileToVFS('Merriweather-Regular.ttf', arrayBufferToBase64(merriweather))
    
    doc.addFont('Roboto-Regular.ttf', 'roboto', 'normal')
    doc.addFont('Roboto-Bold.ttf', 'roboto', 'bold')
    // doc.addFont('Inter.ttf', 'inter', 'normal')
    // doc.addFont('Meriweather-Regular.ttf', 'meriweather', 'normal')
    
    console.log('[DEBUG] Successfully loaded custom fonts')
  } catch (error) {
    console.error('[DEBUG] Failed to load custom fonts:', error)
    console.log('[DEBUG] Falling back to helvetica')
  }
}

const FONTS = {
  HEADING: {
    family: 'roboto',
    style: 'bold',
  },
  BODY: {
    family: 'roboto',
    style: 'normal',
  }
} as const;

const FONT_SIZES = {
  TITLE: 20,
  SECTION_HEADER: 16,
  COMPANY: 14,
  BODY: 12,
  SMALL: 10,
} as const;

// Helper to set font style
const setFont = (doc: jsPDF, type: keyof typeof FONTS, size: number) => {
  doc.setFont(FONTS[type].family, FONTS[type].style);
  doc.setFontSize(size);
};

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function generateAndSavePDF(posting: JobPosting, selectedRepo: string) {
  console.log('[DEBUG] Starting PDF generation for:', posting.company, posting.title);
  const resume = useResumeStore.getState().resume;
  if (!resume) {
    throw new Error('Resume not loaded');
  }
  console.log("Num experience Items:", resume.experience.length);
  
  const doc = new jsPDF()
  
  // Load custom fonts
  await loadFonts(doc)
  
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const lineHeight = 7
  const bottomMargin = pageHeight - margin

  // Helper to check if we need a new page
  const checkNewPage = (currentY: number, neededSpace: number = lineHeight) => {
    if (currentY + neededSpace > bottomMargin) {
      doc.addPage()
      return margin
    }
    return currentY
  }

  // Helper to add wrapped text
  const addWrappedText = (text: string, y: number, fontSize: number = FONT_SIZES.BODY) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
    const totalHeight = lines.length * lineHeight
    
    // Check if we need a new page
    y = checkNewPage(y, totalHeight)
    
    doc.text(lines, margin, y)
    return y + totalHeight
  }

  // Helper to add a section header
  const addSectionHeader = (text: string, y: number) => {
    // Check if we need a new page for the header plus some content
    y = checkNewPage(y, lineHeight * 3)
    
    setFont(doc, 'HEADING', FONT_SIZES.SECTION_HEADER);
    doc.text(text, margin, y)
    setFont(doc, 'BODY', FONT_SIZES.BODY);
    return y + lineHeight * 1.5
  }

  let y = margin

  // Add personal information
  setFont(doc, 'HEADING', FONT_SIZES.TITLE);
  y = addWrappedText(resume.personalInfo.name, y, FONT_SIZES.TITLE)
  setFont(doc, 'BODY', FONT_SIZES.BODY);
  y = addWrappedText(resume.personalInfo.email, y, FONT_SIZES.BODY)
  y = addWrappedText(resume.personalInfo.phone, y, FONT_SIZES.BODY)
  y = addWrappedText(resume.personalInfo.address, y, FONT_SIZES.BODY) + lineHeight

  // Add experience section
  y = addSectionHeader('Experience', y);
  
  if (posting.generatedResume) {
    const { selectedExperienceAccomplishments, selectedExperienceSkills, overview, closing } = posting.generatedResume;
    
    // Overview section
    y = addSectionHeader('Overview', y);
    y = addWrappedText(overview, y) + lineHeight;

    resume.experience.forEach((exp, i) => {
      const selectedAccomplishments = selectedExperienceAccomplishments[i] || [];
      const selectedSkills = selectedExperienceSkills[i] || [];

      // Check if we need a new page for this experience block
      y = checkNewPage(y, lineHeight * 6);

      // Company and position
      setFont(doc, 'HEADING', FONT_SIZES.COMPANY);
      y = addWrappedText(exp.company, y, FONT_SIZES.COMPANY);
      
      setFont(doc, 'BODY', FONT_SIZES.BODY);
      y = addWrappedText(`${exp.dates} • ${exp.city}`, y);
      
      exp.positions.forEach(pos => {
        setFont(doc, 'BODY', FONT_SIZES.BODY);
        y = addWrappedText(pos.title, y);
      });

      // Description
      setFont(doc, 'BODY', FONT_SIZES.BODY);
      y = addWrappedText(exp.description, y);

      // Selected accomplishments
      if (selectedAccomplishments.length > 0) {
        y = checkNewPage(y, lineHeight * 2);
        setFont(doc, 'HEADING', FONT_SIZES.BODY);
        y = addWrappedText('Key Accomplishments:', y);
        setFont(doc, 'BODY', FONT_SIZES.BODY);

        selectedAccomplishments.forEach((accIndex) => {
          y = checkNewPage(y, lineHeight * 2);
          y = addWrappedText(`• ${exp.accomplishments[accIndex]}`, y);
        });
      }

      // Selected skills
      if (selectedSkills.length > 0) {
        y = checkNewPage(y, lineHeight * 2);
        setFont(doc, 'HEADING', FONT_SIZES.BODY);
        y = addWrappedText('Skills Used:', y);
        setFont(doc, 'BODY', FONT_SIZES.BODY);

        const skillsText = selectedSkills
          .map(skillIndex => exp.skills[skillIndex])
          .join(', ');

        y = addWrappedText(skillsText, y);
      }

      y += lineHeight * 2;
    });

    // Projects section
    if (resume.projects.length > 0) {
      y = addSectionHeader('Open Source Projects', y)
      // Filter project items based on selected accomplishments/skills
      const filteredProjects = resume.projects.map((proj, i) => {
        const selectedAccomplishments = posting.generatedResume?.selectedProjectAccomplishments[i] || [];
        const selectedSkills = posting.generatedResume?.selectedProjectSkills[i] || [];

        return {
          ...proj,
          accomplishments: selectedAccomplishments.map(idx => proj.accomplishments[idx]),
          skills: selectedSkills.map(idx => proj.skills[idx])
        };
      });
      for (const project of filteredProjects) {
        y = checkNewPage(y, lineHeight * 4) // Space for project name and details
        
        setFont(doc, 'HEADING', FONT_SIZES.COMPANY);
        y = addWrappedText(project.name, y, FONT_SIZES.COMPANY);
        setFont(doc, 'BODY', FONT_SIZES.BODY);

        if (project.url) {
          y = checkNewPage(y)
          doc.setTextColor(0, 0, 255)
          y = addWrappedText(project.url, y, FONT_SIZES.SMALL)
          doc.setTextColor(0)
        }

        y = checkNewPage(y)
        y = addWrappedText(project.description, y) + lineHeight
        y = addWrappedText(`Technologies: ${project.technologies.join(', ')}`, y, FONT_SIZES.SMALL) + lineHeight
      }
    }

    // Patents section
    if (resume.patents.length > 0) {
      y = addSectionHeader('Patents', y)
      for (const patent of resume.patents) {
        y = checkNewPage(y)
        y = addWrappedText(`${patent.title} (Patent #${patent.number})`, y) + lineHeight
      }
    }

    // Closing section - moved to end
    if (posting.generatedResume?.closing) {
      y = addSectionHeader('Closing', y);
      y = addWrappedText(posting.generatedResume.closing, y);
    }
  }

  // Convert PDF to base64
  const pdfOutput = doc.output('arraybuffer')
  const base64PDF = arrayBufferToBase64(pdfOutput)

  // Before GitHub save
  const fileSlug = `${posting.company}-${posting.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const path = `job-postings/${fileSlug}.pdf`;
  console.log('[DEBUG] Attempting to save PDF at path:', path);
  const { owner, repo } = parseRepoString(selectedRepo);

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

    console.log('[DEBUG] Successfully saved PDF to GitHub at:', path);
    return path
  } catch (error) {
    console.error('[DEBUG] Failed to save PDF:', error)
    throw new Error('Failed to save PDF to GitHub')
  }
} 