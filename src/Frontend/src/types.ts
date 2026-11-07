export interface User {
  id: string;
  email: string;
  fullName: string;
  targetRole?: string;
  yearsOfExperience?: number;
}

export interface ExtractedSkill {
  name: string;
  category: number;
  yearsOfExperience?: number;
  isPrimary: boolean;
}

export interface ExtractedExperience {
  company: string;
  role: string;
  duration?: string;
  description?: string;
}

export interface ResumeProfile {
  fullName: string;
  email?: string;
  phone?: string;
  targetRole?: string;
  totalYearsOfExperience?: number;
  summary: string;
  skills: ExtractedSkill[];
  experiences: ExtractedExperience[];
}

export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  jobType?: string;
  salaryRange?: string;
  url?: string;
  publishedAt?: string;
  overallScore: number;
  semanticSimilarityScore: number;
  skillMatchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations?: string;
  isBookmarked: boolean;
}

export interface TailoredApplication {
  coverLetter: string;
  resumeTips: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  targetRole?: string;
  expiresAt: string;
}
