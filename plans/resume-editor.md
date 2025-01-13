## AI-Assisted Experience Expansion

### Overview
This feature adds conversation-based prompts that help enrich each job role in the master resume with detailed anecdotes, metrics, and stories. The goal is to capture more comprehensive information than a typical resume entry would hold, enabling the user to retain deeper context for future use.

### User Flow & Triggers
- Each experience item (job role) in the master resume can display one or more “conversation starter” suggestions.  
- The LLM also supports starting a freeform conversation with the user at any time (even without a starter suggestion).  
- Clicking a “Start Conversation” or suggested question opens a split view (similar to the job posting flow) where the user and AI converse.

### LLM Interactions
1. **Generating Conversation Starters**  
   - When the user opens the editor for a given experience item, the frontend sends a prompt to the LLM describing that job role.  
   - The LLM responds with a list of short question-like prompts (e.g., “How did you measure success when reducing ops load?”).  
   - These appear as clickable “conversation starter” suggestions.  

2. **Conversation Flow**  
   - Once the user clicks a conversation starter (or opens a freeform chat), the frontend sends the user’s entire message to the LLM, along with relevant context (like the user’s last question or partial resume data).  
   - The LLM responds with clarifying questions or guidance.  
   - The user can continue back-and-forth until satisfied.
   - There's a "send" button that has the same effect as hitting Enter
   - The summary pane is updated every time the user hits enter (submits a message)

3. **Summary Pane**
   - The left pan has the experience item (job role) on the top, and existing
   summary on the bottom.
   - It summarizes the entire conversation as a cohesive anecdote
   - It utilizes an editable text control, so the user can manually edit it as well.
   - Contains a "Save & Exit" button, that ends the conversation and updates the XML
   - While being manually edited, there's also a "Save" button that doesn't exit
   - Upon clicking the edit button, it entires directly into an edit experience,
   an editable text box.

4. **Main Resume Editor**
   - The main resume display shall contain edit & delete buttons for anecdotes
   - When the edit button is clicked, the text turns into a text box that can be
   edited manually by the user (standard editable text box behavior).

### Conversation Experience
- On initiating a conversation (via prompt or button), the user sees a two-pane view:  
  - Left Pane: The selected experience item and Summary Pane.
  - Right Pane: The ongoing conversation.  
- The AI references the user’s existing resume data to suggest clarifications or follow-up questions. For example, “You mentioned reducing ops load for Company X. Could you describe how you accomplished that?”  
- The user can freely respond, add details, and ask the AI to refine or probe further.
- All AI text is rendered in markdown.

### Summarization & Storage
- Once the user feels the conversation has yielded enough detail, they click “Save.”
- The summary from the Summary Pane is appended to the corresponding experience item in `full-resume.xml`.  
- Past conversation logs are not retained. Only the final anecdote is stored in the XML.  
- No backward-incompatible changes are introduced; existing resume data remains valid.

### Motivation & Value
- Users often struggle to recall exact metrics or details from past roles, yet those specifics can strengthen a future application.  
- Conversation-based prompts help jog the user’s memory, encouraging them to record more in-depth experiences.  
- This data forms the basis of future resume tailoring, enabling more powerful summarization and personalization elsewhere in the app.

### Technical Considerations
1. **Data Model Updates**  
   - Incorporate a new optional `<Anecdotes>` section under each `<Experience>` item.  
   - Each anecdote is stored as a text block within that section.  

2. **UI Changes**  
   - When the user arrives on an experience item (e.g., via page load or navigation), the frontend automatically requests fresh conversation starters from the LLM.  
   - These generated starters are not persisted anywhere; if the user refreshes, new prompts appear.  
   - Implement a split-view for conversation similar to the job posting’s analysis page.  

3. **LLM Usage**  
   - Keep prompts minimal; the LLM focuses on open-ended clarifying questions.  
   - Summaries should be succinct but thorough, capturing relevant details from the user’s responses.  
   - Use separate prompts: one for generating conversation starter ideas, and one for facilitating the ongoing dialogue.

4. **Versioning & Git**  
   - All final text appended to `<Anecdotes>` in `full-resume.xml` is automatically versioned through Git commits.  
   - No explicit revision history is stored in the XML, relying instead on Git for rollback.  

5. **Performance & Simplicity**  
   - Handle one conversation at a time.  
   - The user stays within a single job role’s conversation until it’s completed or canceled.  

### Future Extensions
- Potentially use the same conversation interface for other resume sections (e.g., open source projects or skill lists).  
- Provide optional AI transformations (e.g., “Convert anecdote to bullet points”) for flexible usage in job appliand ful.
