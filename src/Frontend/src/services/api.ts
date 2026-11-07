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
    }
  },

  jobs: {
    async getMatches(): Promise<JobMatch[]> {
      const res = await fetch(`${API_BASE}/jobs/matches`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to fetch matches' }));
        throw new Error(err.message || 'Failed to fetch job matches');
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

    async pasteAndMatch(title: string, company: string, description: string): Promise<JobMatch> {
      const res = await fetch(`${API_BASE}/jobs/paste-and-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ title, company, description })
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
  }
};
