export interface User {
  id: number;
  username: string;
  twitterId: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface UserProfile {
  interests?: string;
  brandDirection?: string;
  authorStyle?: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'humorous' | 'inspirational';
}

export type DraftStatus = 'generated' | 'edited' | 'published';

export interface Draft {
  id: number;
  userId: number;
  content: string;
  status: DraftStatus;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface GenerateDraftsRequest {
  count: number;
}

export interface StatusMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
