# Job Post Editor: Analyze Needs

This document outlines the functionality of the "Analyze" step of the job post
editor works. The purpose is to fully understand the job posting. This step is
a collaboration between AI & user to create a more full set of expectations.

---

## Layout
- Company
- Job Title
- AI-summarized job description (just for user)
- AI-summarized company description (just for user)
- Required skills: An EditableList
- Optional skills: An EditableList
- Success criteria: An EditableList


---

## Generation
- The skills & success criteria are generated from the job description using LLM. This is detailed in master-plan.md
- The Company & Job Title are copied verbatim from the job description
- The job description & company description are created via LLM-summarization

---

## Data Usage
- The skills & success criteria are used to generate the resume preview & PDF
- The company description is also used to generate the resume preview & PDF

