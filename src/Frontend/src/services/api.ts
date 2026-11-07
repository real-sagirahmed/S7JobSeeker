import type { AuthResponse, JobMatch, ResumeProfile, TailoredApplication, User } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  auth: {
    async login(email: string, password: string): Promise<AuthResponse> {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(err.message || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      return data;
    },

    async register(email: string, password: string, fullName: string, targetRole?: string): Promise<AuthResponse> {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, targetRole })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(err.message || 'Registration failed');
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      return data;
    },

    async getMe(): Promise<User> {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    },

    logout() {
      localStorage.removeItem('token');
    }
  },

  profile: {
    async uploadResume(file: File): Promise<ResumeProfile> {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/profile/upload-resume`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message || 'Failed to upload and parse resume');
      }

      return res.json();
    },

    async getProfile(): Promise<ResumeProfile | null> {
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { ...getAuthHeader() }
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },

    async addSkill(name: string, category: number = 9, yearsOfExperience: number = 1): Promise<ResumeProfile> {
      const res = await fetch(`${API_BASE}/profile/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ name, category, yearsOfExperience })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to add skill' }));
        throw new Error(err.message || 'Failed to add skill');
      }
      return res.json();
    },

    async deleteSkill(skillName: string): Promise<ResumeProfile> {
      const res = await fetch(`${API_BASE}/profile/skills/${encodeURIComponent(skillName)}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to delete skill' }));
        throw new Error(err.message || 'Failed to remove skill');
      }
      return res.json();
    }
  },

  jobs: {
    async getMatches(source?: number, remoteOnly?: boolean): Promise<JobMatch[]> {
      const params = new URLSearchParams();
      if (source && source !== 0) params.append('source', source.toString());
      if (remoteOnly) params.append('remoteOnly', 'true');
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${API_BASE}/jobs/matches${query}`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to fetch matches' }));
        throw new Error(err.message || 'Failed to fetch job matches');
      }
      return res.json();
    },

    async getSaved(): Promise<JobMatch[]> {
      const res = await fetch(`${API_BASE}/jobs/saved`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to fetch saved jobs' }));
        throw new Error(err.message || 'Failed to fetch saved jobs');
      }
      return res.json();
    },

    async syncJobs(): Promise<{ totalFetched: number; totalNew: number }> {
      const res = await fetch(`${API_BASE}/jobs/sync`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        throw new Error('Failed to trigger job sync');
      }
      return res.json();
    },

    async pasteAndMatch(title: string, company: string, description: string, url?: string): Promise<JobMatch> {
      const res = await fetch(`${API_BASE}/jobs/paste-and-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ title, company, description, url })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to evaluate match' }));
        throw new Error(err.message || 'Failed to analyze custom job');
      }
      return res.json();
    },

    async generateTailoredApplication(jobId: string): Promise<TailoredApplication> {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/tailored-application`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Generation failed' }));
        throw new Error(err.message || 'Failed to generate tailored application');
      }
      return res.json();
    },

    async toggleBookmark(jobId: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/bookmark`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) throw new Error('Failed to toggle bookmark');
      const data = await res.json();
      return data.isBookmarked;
    }
  },

  companies: {
    async getAll(params: {
      search?: string;
      category?: number;
      tech?: string;
      workModel?: string;
      page?: number;
      pageSize?: number;
    } = {}): Promise<import('../types').CompanyListResponse> {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category) query.append('category', params.category.toString());
      if (params.tech) query.append('tech', params.tech);
      if (params.workModel && params.workModel !== 'All') query.append('workModel', params.workModel);
      if (params.page) query.append('page', params.page.toString());
      if (params.pageSize) query.append('pageSize', params.pageSize.toString());

      const res = await fetch(`${API_BASE}/companies?${query.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) throw new Error('Failed to load companies');
      return res.json();
    },

    async getTopMatches(limit: number = 30): Promise<import('../types').BdCompany[]> {
      const res = await fetch(`${API_BASE}/companies/top-matches?limit=${limit}`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to load top company matches' }));
        throw new Error(err.message || 'Failed to load company matches');
      }
      return res.json();
    },

    async getActiveJobs(companyId: string): Promise<import('../types').JobMatch[]> {
      const res = await fetch(`${API_BASE}/companies/${companyId}/active-jobs`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) throw new Error('Failed to load active jobs for company');
      return res.json();
    },

    async generatePitch(companyId: string, pitchType: string = 'ColdEmail'): Promise<import('../types').TailoredPitch> {
      const res = await fetch(`${API_BASE}/companies/${companyId}/generate-pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ pitchType })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Pitch generation failed' }));
        throw new Error(err.message || 'Failed to generate tailored pitch');
      }
      return res.json();
    },

    async suggest(data: import('../types').SuggestCompanyRequest): Promise<{ message: string; companyId: string }> {
      const res = await fetch(`${API_BASE}/companies/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to submit company suggestion' }));
        throw new Error(err.message || 'Failed to submit company suggestion');
      }
      return res.json();
    },

    async suggestCompany(data: import('../types').SuggestCompanyRequest): Promise<{ message: string; companyId: string }> {
      return this.suggest(data);
    }
  }
};
