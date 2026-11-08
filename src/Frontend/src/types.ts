export interface User {
  id: string;
  email: string;
  fullName: string;
  targetRole?: string;
  yearsOfExperience?: number;
  isAdmin?: boolean;
  aiCredits?: number;
  trialEndsAt?: string;
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
  source?: number;
  sourceName?: string;
}

export interface TailoredApplication {
  coverLetter: string;
  resumeTips: string;
}

export type CompanyCategory = 
  | 1 // EnterpriseOutsourcing
  | 2 // GlobalSaaSAndProduct
  | 3 // FintechAndHighScale
  | 4 // CloudDevOpsAndInfra
  | 5 // AIAndDataIntelligence
  | 6; // DigitalAgencyAndConsulting

export interface BdCompany {
  id: string;
  name: string;
  slug: string;
  website: string;
  careersUrl: string;
  linkedInUrl?: string;
  category: CompanyCategory;
  globalProducts: string;
  description: string;
  primaryTechStack: string[];
  headquarters: string;
  globalOffices: string;
  workModel: string;
  employeeCountRange: string;
  isVerified: boolean;
  activeJobsCount: number;
  fitScore?: number;
  matchingSkills?: string[];
  missingSkills?: string[];
}

export interface CompanyListResponse {
  items: BdCompany[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClusterSummary {
  clusterKey: string;
  title: string;
  tagline: string;
  categoryId: number;
  totalCompanies: number;
  activeJobsCount: number;
  featuredCompanies: string[];
  isSpecial: boolean;
}

export interface TailoredPitch {
  companyName: string;
  pitchType: string;
  subject: string;
  content: string;
  highlightedSkills: string[];
}

export interface SuggestCompanyRequest {
  name: string;
  website: string;
  careersUrl?: string;
  category: number;
  globalProducts?: string;
  description?: string;
  primaryTechStack?: string[];
  headquarters?: string;
  workModel?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  targetRole?: string;
  isAdmin?: boolean;
  aiCredits?: number;
  trialEndsAt?: string;
  expiresAt: string;
}

export interface CreditBundle {
  id: number;
  name: string;
  credits: number;
  priceBdt: number;
  badgeText: string;
  isPopular: boolean;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  creditsAmount: number;
  amountPaidBdt: number;
  method: string;
  senderNumber: string;
  transactionId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SubscriptionStatus {
  aiCredits: number;
  trialEndsAt: string;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isAdmin: boolean;
  recentTransactions: CreditTransaction[];
}

export interface SaaSPlatformSettings {
  id: number;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  paymentInstructions: string;
  welcomeCredits: number;
  trialDays: number;
  updatedAt?: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeCandidates: number;
  totalJobs: number;
  pendingPaymentsCount: number;
  approvedPaymentsCount: number;
  totalRevenueBdt: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  targetRole?: string;
  isAdmin: boolean;
  aiCredits: number;
  trialEndsAt: string;
  isTrialActive: boolean;
  createdAt: string;
  totalTransactions: number;
}

