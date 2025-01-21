# Job Post Editor: Extended Plan

This document outlines how the job post editor will handle AI-driven suggestions, user interaction, and data storage. The goal is to enhance the editor’s functionality by allowing section-specific improvements, verifying truthfulness, and engaging in an iterative feedback loop with the user.

---

## AI-Driven Suggestions

### Overview
- The AI suggestions focus on four key sections of the targeted resume:
  1. **Overview**  
  2. **Summary**  
  3. **Experience** — Each entry is it's own section
  4. **Open Source Projects** — Each entry is it's own section

- Each section will display an icon or badge indicating available suggestions. Clicking the icon opens a popover to view and manage suggestions.

### Suggestion Generation and Display
- After an initial targeted resume is generated, AI automatically produces a set of suggestions for each section.  
- Suggestions address:
  - Truthfulness checks (ensuring content matches the original resume).  
  - Coverage checks (highlighting missing details from the master resume).  
  - Unnecessary detail removal.  
  - Hiring manager perspective (qualifications or red flags).
  - Company perspective (e.g. traits desireable to a startup vs a government contractor)

- The UI for suggestions will not label or organize them separately by “truthfulness” or “hiring manager perspective.” Instead, suggestions will be combined in one cohesive list to keep the interface simple.

---

## User Interaction and Feedback

### Suggestion Management
- Each suggestion can be either accepted (checked) or removed (unchecked). They're checked by default.
- The user can also add free-text feedback, describing any clarifications or additional edits they would like the AI to consider.

### Section Regeneration Workflow
1. **Open the Popover**  
   - The user sees the AI suggestions along with an empty text box for their own feedback/clarifications.
2. **Adjust Suggestions**  
   - The user can remove suggestions they disagree with or keep them checked for inclusion.
3. **Provide Additional Context**  
   - The user types any extra instructions, clarifications, or details in the popover’s text box (plain text).
4. **Submit**  
   - Once submitted, the AI takes:
     - The current section text.  
     - The checked suggestions.  
     - The user’s additional feedback.  
     - The entire master copy of the resume.
   - The AI then regenerates an updated version of that specific section.
5. **XML Update**  
   - The newly generated section overrides the old version within the job posting XML.
   - All suggestions/feedback (both AI- and user-generated) are appended to the XML, accompanied by timestamps.

---

## Data Flow and Storage
- **XML Files**  
  - The job posting XML file will hold “current version” content for each section, plus:
    - Accepted suggestions.  
    - Removed suggestions.  
    - User feedback or clarifications.  
    - Timestamps for each stage of editing.

- **Versioning Approach**  
  - Older section content is not retained (to keep the file simpler).  
  - Important context from previous cycles is stored in the form of collected suggestions and user commentary, acting as a “constitution” or stable reference for future AI calls.

---

## UI Flow

1. **Generating the Targeted Resume**  
   - Once a job post is created or imported, the user clicks “Generate Targeted Resume,” which produces an initial version of the resume tailored to that posting.

2. **Viewing and Editing Sections**  
   - The user reviews each section (Overview, Summary, Experience, etc.).  
   - A small icon or badge indicates that new suggestions are available.

3. **Popover Interaction**  
   - On clicking the icon, a popover shows the list of AI suggestions for that section.  
   - The user can remove unwanted suggestions or add clarifications.

4. **Regeneration**  
   - The user clicks a “Submit” or “Apply” button to finalize updates for that section, prompting the AI to regenerate only that portion of the resume.  
   - The new version is saved to the XML, including suggestions and user feedback.

5. **Finalization**  
   - The user can repeat the suggestion process for each section as needed.  
   - When satisfied, they can export the entire resume to PDF.

---

## Layout
- A three step flow: Review Posting -> Analyze -> Generate
- "Export" and download PDF are lone buttons on the "Generate" page (the preview)
- There's a bottom bar with Next/Previous buttons on the right, and action buttons on the left:
   - "Analyze Posting" (on Review Posting step)
   - "Generate Preview" (on Analyze Needs step)
   - "Regenerate" (on Generate step)
- The current active step is visually distinct

---

## Future Considerations
- **Granular Scoring**  
  - If more sophisticated prioritization is needed in the future, we can explore assigning confidence or urgency to each suggestion.
- **Collaboration Features**  
  - The plan could be extended to handle multiple contributors, capturing their user IDs along with timestamps.  
- **Enhanced History**  
  - A UI-based “timeline” or “history view” could be added to reflect how each section evolved over time.

---

## Rules of Engagement
- Always check the repository for similar files and/or functions before creating new ones
- Never break existing functionality
- Run `npx tsc --newEmit` frequently to check for errors globally before continuing
- Always use the resume object loaded from ResumeStore, and take job experience items from it

## Conclusion

This plan aims to integrate AI-driven suggestions into the job post editor, providing a user-friendly workflow that balances automated assistance with human oversight. By recording all suggestions, feedback, and final updates in the XML, the editor gains a lasting reference that improves the consistency and keeps future iterations grounded in established truths and objectives.