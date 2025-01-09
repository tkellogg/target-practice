export interface Position {
  title: string
  startDate: string
  endDate: string
}

export interface Experience {
  company: string
  positions: Position[]
  skills: string[]
  description: string
  accomplishments: string[]
  dates: string
}

export interface Project {
  name: string
  url: string
  description: string
  technologies: string[]
}

export interface Patent {
  number: string
  title: string
}

export interface PersonalInfo {
  name: string
  address: string
  phone: string
  email: string
  description: string
}

export interface Resume {
  personalInfo: PersonalInfo
  experience: Experience[]
  projects: Project[]
  patents: Patent[]
} 