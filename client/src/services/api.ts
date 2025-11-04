import type {
  AuthStatus,
  UserProfile,
  Draft,
  DraftStatus,
  GenerateDraftsRequest,
} from '../types';

const API_BASE = '';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  checkStatus: () => fetchAPI<AuthStatus>(`${API_BASE}/auth/status`),

  login: () => {
    window.location.href = `${API_BASE}/auth/twitter`;
  },

  logout: () => fetchAPI<{ success: boolean }>(`${API_BASE}/auth/logout`, {
    method: 'POST',
  }),
};

// User Profile API
export const userAPI = {
  getProfile: () => fetchAPI<UserProfile>(`${API_BASE}/api/user/profile`),

  updateProfile: (profile: UserProfile) =>
    fetchAPI<{ success: boolean; profile: UserProfile }>(
      `${API_BASE}/api/user/profile`,
      {
        method: 'PUT',
        body: JSON.stringify(profile),
      }
    ),
};

// Draft API
export const draftAPI = {
  getAll: (status?: DraftStatus) => {
    const url = status
      ? `${API_BASE}/api/drafts?status=${status}`
      : `${API_BASE}/api/drafts`;
    return fetchAPI<Draft[]>(url);
  },

  generate: (request: GenerateDraftsRequest) =>
    fetchAPI<{ success: boolean; drafts: Draft[] }>(
      `${API_BASE}/api/drafts/generate`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    ),

  update: (id: number, content: string) =>
    fetchAPI<{ success: boolean; draft: Draft }>(
      `${API_BASE}/api/drafts/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }
    ),

  publish: (id: number) =>
    fetchAPI<{ success: boolean; draft: Draft }>(
      `${API_BASE}/api/drafts/${id}/publish`,
      {
        method: 'POST',
      }
    ),

  regenerate: (id: number) =>
    fetchAPI<{ success: boolean; draft: Draft }>(
      `${API_BASE}/api/drafts/${id}/regenerate`,
      {
        method: 'POST',
      }
    ),

  delete: (id: number) =>
    fetchAPI<{ success: boolean }>(`${API_BASE}/api/drafts/${id}`, {
      method: 'DELETE',
    }),
};

// Content Operations API
export const contentAPI = {
  analyzeTendency: () =>
    fetchAPI<{ success: boolean; message: string }>(
      `${API_BASE}/api/drafts/analyze`,
      {
        method: 'POST',
      }
    ),

  crawlContent: () =>
    fetchAPI<{ success: boolean; message: string }>(
      `${API_BASE}/api/drafts/crawl`,
      {
        method: 'POST',
      }
    ),
};
