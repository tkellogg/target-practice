# Project Description
This is a frontend-only web app written in React via Vite. It uses stores data via the github APIs,
primarily in XML markup. And it uses Material UI to create beautiful UI elements. It defaults to
either light or dark mode based on the system theme.

The app is a resume manager. I'm going to import my resume through some means (I'll probably script 
the creation of the XML file out-of-band), and then this app is for managing the entries and exporting
versions of it for various job descriptions.

The server starts with a github API access key stored in an environment variable (and thus served through
JS/HTML/API to the frontend code). I'll take care of supplying the access key via `gh auth token` when the
local Vite server starts.

Upon page load, the user may select a Github repo from a dropdown, and then the page is loaded via downloading
`full-resume.xml` from the root of the repo. The app then displays an editor view of the resume. 

## The Editor
Each text element, regardless if it's single or multiline, defaults to being non-editable, but when you click
on it, it turns into an editable text box. The top-level contains all information items, like my name, address,
and a very long high-level description of myself. Each job entry has seperate fields for company name, dates,
positions (in-order), list of skills & tech used, overall description of what I did, as well as a list of bullet 
point accomplishments. 
Bullet point list items always contain a delete button.

Below the experience section, there are sections for open source projects, patents & education. Projects are each name, URL,
longer description & list of technologies used. Patents are each patent number & title, and that's it.

There's a "Save" button that's always visible (via a menu bar?). When it's clicked, it takes all the editor data,
formats it as human-readable XML (merge-safe, well indented, etc.) and saved back to `full-resume.xml`.

## Job Postings
Then there's a job postings tab. It's a 4 stage process:

 1. Create/Import posting
 2. Analyze needs
 3. Generate & Analyze resume against needs (collaboratively)
 4. Export

Each has a company name, position name & URL to job posting. When you open the job
posting, there's another page where you can paste in the job posting text. Upon pasting in the text, we immediately
proceed to the Analyze step. We use LLMs to parse the posting into all the various components — title, 
role description, company description, optional & non-optional job requirements. 

The app also completes the Analyze needs step, in which another LLM call states what it thinks will make 
the candidate successful. This is a list of statements. The success criteria for job postings are editable, so the 
user can also edit them. Success criteria includes not only things called out in the job description, but also
things implied, or assumptions we can make (e.g. "Candidate should take on large breadth of responsibilities" 
due to it being a startup). Success criteria is one single list and is the sum total of what the LLM scraped,
what the LLM assumed, and what the user also called out or edited. Success criteria is only generated once after
the initial parse, and is henceforth managed by the user and saved into Github as an XML file.

Once the user clicks "Generate", it writes a version of the resume that's tailored specifically to that job description.
The resume has the following structure.

1. Personal information
2. Overview: 2 sentences; Summarize character traits & experience directly relevant to the job
3. Job history / experience
4. Open source contributions
5. Patents
6. Education
7. Closing: 8-10 sentences; Call out specific experiences at specific jobs and correlate them to job requirements.

For each experience item, succinctly describe that experience independently of the job posting, but always implicitly allude
to and highlight portions of the experience that demonstrate the user's suitability as a candidate for the role.

Job postings are all stored in Github at `/job-postings/{company}-{title}.xml`. Exported resumes are
stored at `/job-postings/{company}-{title}.pdf`. 

The XML file for the job posting includes:
- The job posting info
- All inferred information about the job posting
- The info needed to generate the Resume

Upon clicking "Generate", after the resume is fully generated, the XML is updated to include all generated bits
(though not stored in XML as it's displayed). Subsequent loads should load from the XML rather than re-generate.

Upon clicking the "Export" button on a job posting, it renders a plain HTML layout and uses jsPDF to convert it
to PDF (which is then saved to Github). The exported view should be identical to the generated view in every way possible.

