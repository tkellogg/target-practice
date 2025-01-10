export interface JobAnalysis {
  title: string
  roleDescription: string
  companyDescription: string
  requiredSkills: string[]
  optionalSkills: string[]
  successCriteria: string[]
}

export interface JobPosting {
  id: string
  company: string
  title: string
  url: string
  rawText: string
  analysis: JobAnalysis | null
  generatedResume: string | null
} 