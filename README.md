# Resume Manager

A React-based web application for managing resumes and job applications. Built with Vite, Material UI, and GitHub API integration.

## The Problem

Companies increasingly use AI/LLMs to process job applications and resumes. This creates a need to:

1. **Optimize for AI Processing**: Each resume needs to be clear, specific, and formatted in a way that's easily parsed by LLMs
2. **Tailor Content**: Different roles need different aspects of your experience highlighted
3. **Maintain Accuracy**: While tailoring content, it's crucial not to fabricate or exaggerate details

This app solves these challenges through a "master copy" approach:

- Maintain a verbose, comprehensive version of your resume with ALL details
- For each job application, the app uses AI to:
  - Analyze the job posting's explicit and implicit requirements
  - Select and reframe relevant experiences from your master copy
  - Format a tailored version that emphasizes matching qualifications
  - Never invent details, only reframe what's already documented

This ensures each application is both tailored and truthful, optimized for both human and AI readers.

## Architecture

The app is built as a frontend-only web application that interacts directly with GitHub's API for storage. This design was chosen because:

1. **Privacy**: Your resume data is stored in your private GitHub repository, giving you full control over access
2. **Version Control**: Git provides automatic versioning and history of all changes
3. **No Database**: By using GitHub for storage, we eliminate the need for a separate database
4. **Simplicity**: The frontend-only architecture means you can run it locally without complex setup

The application uses:
- React + Vite for the frontend
- Material UI for the interface
- GitHub API for data storage
- Anthropic's Claude API for AI analysis
- XML for data format (chosen for readability and merge-friendliness)

**Note**: Currently, this is a local-only application. You'll need to run it on your own machine - there is no hosted version.

## Features

- **Resume Editor**
  - Edit your full resume with clickable text fields
  - Organize experience, projects, and patents
  - Auto-saves to GitHub as XML
  - Beautiful Material UI interface
  - Light/dark mode based on system theme

- **Job Posting Management**
  - Import and analyze job postings
  - AI-powered analysis of requirements and success criteria
  - Generate tailored resumes for each position
  - Export to PDF with professional formatting
  - All data stored in GitHub as XML

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   VITE_GH_ACCESS_KEY=your_github_token
   VITE_ANTH_API_KEY=your_anthropic_key
   ```
4. Verify `.env` is not tracked by git:
   ```bash
   git ls-files .env  # Should return no output
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend runs on port 3001 and the backend on port 3002.

## Usage

1. **Select Repository**
   - Choose a GitHub repository from the dropdown (typically a private repo)
   - The app will load `full-resume.xml` from the root

2. **Edit Resume**
   - Click any text to edit
   - Changes are saved automatically
   - Supports rich text formatting

3. **Manage Job Postings**
   - Create new job postings
   - AI analyzes requirements
   - Generate tailored resumes
   - Export to PDF

## File Structure

- `/full-resume.xml` - Complete resume data (stored in your private repo)
- `/job-postings/yyyy-mm-dd-{company}-{title}.xml` - Job posting data
- `/job-postings/yyyy-mm-dd-{company}-{title}.pdf` - Generated PDFs

## Development

- Built with React + Vite
- TypeScript for type safety
- Material UI components
- GitHub API for storage
- Anthropic API for AI analysis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Privacy Note

This application is designed to work with private GitHub repositories. Your resume data and job applications should be stored in a private repository that only you can access. The application code itself can be public, as it contains no sensitive information. 