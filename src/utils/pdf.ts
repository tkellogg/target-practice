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
import { Resume, Experience } from '../types/Resume'
import { Octokit } from '@octokit/rest'
import { getFileContent, parseRepoString } from './github'
import { parseXMLToResume } from './xml'

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
  const { owner, repo } = parseRepoString(selectedRepo)
  const xmlContent = await getFileContent(owner, repo, 'full-resume.xml')
  
  const resume = parseXMLToResume(xmlContent)
  if (!resume) {
    throw new Error('Failed to parse resume XML')
  }

  return resume
}

export async function generateAndSavePDF(posting: JobPosting, selectedRepo: string) {
  console.log('[DEBUG] Starting PDF generation for:', posting.company, posting.title);
  const resume = await getFullResume(selectedRepo)
  const doc = new jsPDF()
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
  const addWrappedText = (text: string, y: number, fontSize: number = 12) => {
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
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(text, margin, y)
    doc.setFont('helvetica', 'normal')
    return y + lineHeight * 1.5
  }

  let y = margin

  // Add personal information
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  y = addWrappedText(resume.personalInfo.name, y, 20)
  doc.setFont('helvetica', 'normal')
  y = addWrappedText(resume.personalInfo.address, y, 12) + lineHeight

  // Add experience section
  y = addSectionHeader('Experience', y);
  
  if (posting.generatedResume) {
    const { selectedExperienceAccomplishments, selectedExperienceSkills, experienceMap, overview, closing } = posting.generatedResume;
    
    // Overview section
    y = addSectionHeader('Overview', y);
    y = addWrappedText(overview, y) + lineHeight;

    resume.experience.forEach((exp, i) => {
      const expId = `exp_${i}`;
      const selectedAccomplishments = selectedExperienceAccomplishments[expId] || [];
      const selectedSkills = selectedExperienceSkills[expId] || [];
      const expMap = experienceMap[i];

      if (!expMap) {
        console.warn(`No experience map found for experience ${i}`);
        return;
      }

      // Check if we need a new page for this experience block
      y = checkNewPage(y, lineHeight * 6);

      // Company and position
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(exp.company, y, 14);
      
      exp.positions.forEach(pos => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        y = addWrappedText(`${pos.title} (${pos.startDate} - ${pos.endDate})`, y);
      });

      // Description
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      y = addWrappedText(exp.description, y);

      // Selected accomplishments
      if (selectedAccomplishments.length > 0) {
        y = checkNewPage(y, lineHeight * 2);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        y = addWrappedText('Key Accomplishments:', y);
        doc.setFont('helvetica', 'normal');

        exp.accomplishments.forEach((acc, j) => {
          if (!expMap.accomplishments[j]) return;
          const accId = expMap.accomplishments[j].id;
          if (selectedAccomplishments.includes(accId)) {
            y = checkNewPage(y, lineHeight * 2);
            y = addWrappedText(`• ${acc}`, y);
          }
        });
      }

      // Selected skills
      if (selectedSkills.length > 0) {
        y = checkNewPage(y, lineHeight * 2);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        y = addWrappedText('Skills Used:', y);
        doc.setFont('helvetica', 'normal');

        const skillsText = exp.skills
          .map((skill, j) => {
            if (!expMap.skills[j]) return null;
            const skillId = expMap.skills[j].id;
            return selectedSkills.includes(skillId) ? skill : null;
          })
          .filter(Boolean)
          .join(', ');

        y = addWrappedText(skillsText, y);
      }

      y += lineHeight * 2;
    });

    // Closing section
    y = addSectionHeader('Closing', y);
    y = addWrappedText(closing, y);
  }

  // Projects section
  if (resume.projects.length > 0) {
    y = addSectionHeader('Open Source Projects', y)
    // Filter project items based on selected accomplishments/skills
    const filteredProjects = resume.projects.map((proj, i) => {
      const projId = `proj_${i}`;
      const selectedAccomplishments = posting.generatedResume?.selectedProjectAccomplishments[projId] || [];
      const selectedSkills = posting.generatedResume?.selectedProjectSkills[projId] || [];

      return {
        ...proj,
        accomplishments: proj.accomplishments.filter((_, idx) => selectedAccomplishments.includes(`acc_${idx}`)),
        skills: proj.skills.filter((_, idx) => selectedSkills.includes(`skill_${idx}`))
      };
    });
    for (const project of filteredProjects) {
      y = checkNewPage(y, lineHeight * 4) // Space for project name and details
      
      doc.setFont('helvetica', 'bold')
      y = addWrappedText(project.name, y, 14)
      doc.setFont('helvetica', 'normal')

      if (project.url) {
        y = checkNewPage(y)
        doc.setTextColor(0, 0, 255)
        y = addWrappedText(project.url, y, 10)
        doc.setTextColor(0)
      }

      y = checkNewPage(y)
      y = addWrappedText(project.description, y) + lineHeight/2
      y = addWrappedText(`Technologies: ${project.technologies.join(', ')}`, y, 10) + lineHeight
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