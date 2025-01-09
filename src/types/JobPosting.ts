export interface JobAnalysis {
  title: string
  roleDescription: string
  companyDescription: string
  requirements: {
    required: string[]
    optional: string[]
  }
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