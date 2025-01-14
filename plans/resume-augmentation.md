# Resume Augmentation via Summarized Anecdotes

This document expands on how the **summarized anecdotes** described in [resume-editor.md](./resume-editor.md) can directly enhance specific parts of each job entry in the user’s resume. The overall goal is to integrate these anecdote-driven improvements in a way that’s easy to accept or reject, ensuring any final modifications to the resume remain fully under the user’s control.

---

## Overview

For each job entry in the resume, if (and only if) the user has a saved or ongoing **summarized anecdote** relevant to that job, a “magic wand” icon appears next to:
1. The job description  
2. The skills list  
3. The accomplishments list  

When the user clicks the magic wand icon for any of these sections, they will see AI-generated suggestions (based on the anecdote) to update or augment that content. The user can then decide whether to accept or reject the suggested changes.

---

## Flow & Constraints

1. **Anecdote Existence**  
   - The “magic wand” icon is only displayed if there is an existing summarized anecdote from [resume-editor.md](./resume-editor.md).  
   - If no relevant anecdote data exists for that job, the icon does not appear at all for any of the sections within it.

2. **Section-Specific Updates**  
   - **Job Description**  
     - Diff-based approach: display the current version in red and the proposed version in green (GitHub-style highlighting).  
     - Soft limit of 2 sentences per job description for the LLM, but the user can add or remove lines manually after acceptance.  
     - Acceptance is “all or nothing” for the proposed block. If accepted, the new block replaces the old block in the XML. If rejected, no changes occur.  
   - **Skills**  
     - Up to 10 proposed additions. Each new skill is displayed as a discrete item with a checkbox or buttons for accept/reject.  
     - Accepting a skill merges it into the existing skills in the XML file; rejecting it discards it.  
   - **Accomplishments**  
     - Up to 3 proposed additions. Same accept/reject model as skills.  

3. **Storage & Persistence**  
   - Suggestions remain in-memory (React state or similar) until the user explicitly accepts them.  
   - Once accepted, modifications are written to `full-resume.xml`.  

4. **Presentation & Actions**  
   - The magic wand icon remains visible next to each relevant section heading.  
   - Clicking immediately shows a spinner for progress, then displays the red/green AI suggestions inline for that specific section.  
   - **Job Description**:  
     - Red text indicates the existing content to be replaced; green text indicates the proposed replacement.  
     - An “Accept” (✔) or “Reject” (✖) button handles the entire block.  
   - **Skills & Accomplishments**:  
     - Each proposed addition appears in a discrete list item with accept/reject.  
     - The user may choose per-item acceptance, but must confirm all choices (finish or cancel) to finalize.  
   - A “Regenerate” or “Fetch New Suggestions” button may appear to discard the old suggestions and request updated ones from the LLM.

5. **Limiting Factors & Edge Cases**  
   - Skills suggestions are capped at 10 in total.  
   - Accomplishments are capped at 3 in total.  
   - The job description is limited to one single block update at a time, abiding by the 2-sentence soft limit for LLM generation.  
   - If the user regenerates suggestions, old proposals are discarded.  

---

## User Acceptance Flow

1. **Click Wand → See Suggestions**  
   - The user views inline diffs for job description changes (red vs. green).  
   - The user sees a list of potential additions for skills/accomplishments.  

2. **Completion**  
   - For job description, the user either accepts the entire proposed update or rejects it.  
   - For skills/accomplishments, each suggested item can be accepted or rejected.  
   - After finalizing accept/reject actions, the suggestions are either merged into `full-resume.xml` (for accepted items) or discarded.

   - The standard “Save” button ends any in-progress edits and discards any unaccepted changes.

---

## Technical Highlights

1. **Frontend Integration**  
   - All logic for displaying diffs or proposed list additions is handled on the frontend.  
   - Data is stored in Github XML files, as usual, once accepted.

2. **LLM Interaction**  
   - The AI suggestions for each section (job description, skills, accomplishments) are derived from the job’s **summarized anecdote** in [resume-editor.md](./resume-editor.md).  
   - When relevant, multiple suggestions are tagged with the section they apply to (e.g., “job description,” “skills,” “accomplishments”).  
   - Prompts live in `prompts.ts` and all Anthropic API calls use the backend.

3. **XML Updates**  
   - On acceptance, the frontend code merges updated content into `full-resume.xml` with proper indentation (2 spaces) and human-readable formatting.  

---

## Future Considerations

- **Extending to Other Resume Sections**  
  Future: Potential expansions might enable “magic wand” icons in other parts of the resume—e.g., projects, custom sections, etc.  

- **Longer Job Descriptions**  
  Users may override the 2-sentence limit if they desire deeper detail. The limit serves mainly to keep LLM output concise.

---

## Summary

This feature complements the summarized anecdotes from “resume-editor.md” by offering inline augmentation tools for job descriptions, skills, and accomplishments. The user has a clear, granular accept/reject workflow for each suggestion. Once approved, changes are committed to `full-resume.xml`, ensuring alignment with the existing GitHub-driven XML storage approach.
