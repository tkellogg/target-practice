# Target Practice

Create resumes that are targeted at specific job postings.

## The Problem

Hiring managers are so slammed with stacks of resumes, that they really have to be
spoonfed the exact information they're looking for. But that's a lot of work on you,
the job candidate.

Furthermore, it sucks to write a resume. It's hard enough trying to remember what you
did, now you also have to phrase it so that it sounds good. And did I even do anything
that sounds good?

## The Solution

It's a two step process:

1. Build a resume. Not just a resume, a huge bank of stories about projects, etc.
2. Upload job description, and export a resume that's targeted specifically to it.

The stories are key. We use an AI to interview you, to prod you with questions to talk
more and more about details that you've forgotten. The AI also takes care of making
sure it all sounds professional. Using the AI, you can generate accomplishments & 
skills extracted from the stories. In my case, I have 20-30 skills for each of my jobs.
Make it extremely comprehensive.

UX Design Principle: You always have the ability to edit any LLM-generated text.

When it comes time to generating the targeted resume, after uploading the job posting,
the LLM analyzes the post for what's needed to be successful. You can collaborate on
that analysis, and then generate a resume PDF. The final resume is mostly the same as
the full resume, but filtered down to just accomplishments & skills that are relevant
to the job posting.


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
   VITE_GH_ACCESS_KEY=your_github_access_key
   VITE_ANTH_API_KEY=your_anthropic_key
   ```
   The Github access key is acquired by running `gh auth token`. Your Anthropic
   key should be obtained from Anthropic [here](https://docs.anthropic.com/en/api/getting-started). You'll probably have to setup a credit card with Anthropic,
   but it likely won't cost much money.
4. Verify `.env` is not tracked by git:
   ```bash
   git ls-files .env  # Should return no output
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend runs on port 3001 and the backend on port 3002.

## Further Setup

1. Create a *private* Github repository. e.g. call it `resume` or `resume-curated`, 
   whatever. This is where all your data & PDFs will be stored.
2. Create a file in that repo called `full-resume.xml`
3. Copy the contents of `EXAMPLE.xml` and paste it into ChatGPT, Claude, or whatever
   your favorite AI is, along with your resume, and have it convert your resume to
   that format. It's not a big deal if it's off by a little, it just has to get close.
4. Paste the XML version of your resume into `full-resume.xml` in your private repo.
5. Commit/push (or just use the github UI)

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
- `/job-postings/{company}-{title}.xml` - Job posting data
- `/job-postings/{company}-{title}.pdf` - Generated PDFs

## Plans
This repo was designed to work with agentic coding AIs, like Cursor Agent.
New features should be first described in the proper markdown file in `plans/`.
While you're using an agent, have the proper plan files in your context. Doing
this helps keep the agents on the right path.

Occasionally you need to fix bugs in the plans. Discrepancies & poorly organized
thoughts can confuse agents. Use a reasoning model like o1 or R1 to help write
clear & concise plans.

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