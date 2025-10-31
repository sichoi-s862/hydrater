export interface User {
  id: string;
  twitter_id: string;
  username: string;
  display_name: string;
  profile_image_url?: string;
  access_token: string;
  access_token_secret: string;
  interests?: string[];
  brand_direction?: string;
  author_style?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  interests: string[];
  brand_direction: string;
  author_style: string;
  target_audience?: string;
  tone?: string;
}

export interface Draft {
  id: string;
  user_id: string;
  content: string;
  source_urls?: string[];
  status: 'generated' | 'reviewed' | 'edited' | 'published' | 'archived';
  edited_content?: string;
  published_at?: Date;
  tweet_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CrawledContent {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  published_date?: Date;
  relevance_score: number;
  created_at: Date;
}

export interface TendencyAnalysis {
  user_id: string;
  common_topics: string[];
  posting_frequency: string;
  engagement_patterns: Record<string, any>;
  style_markers: string[];
  analyzed_at: Date;
}
