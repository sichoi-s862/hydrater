// Tweet types
export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  engagement_score: number;
  has_emoji: boolean;
  has_hashtag: boolean;
  length: number;
}

export interface TweetWithEmbedding extends Tweet {
  qdrant_point_id?: string;
}

// Qdrant types
export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    user_id: string;
    tweet_id: string;
    text: string;
    created_at: string;
    engagement_score: number;
    has_emoji: boolean;
    has_hashtag: boolean;
    length: number;
  };
}

export interface SimilarTweet {
  tweet: Tweet;
  similarity: number;
}

// User style profile
export interface UserStyleProfile {
  user_id: string;
  avg_length: number;
  emoji_frequency: number;
  hashtag_frequency: number;
  tone: string;
  sentence_structure: string;
  updated_at: string;
}

// Draft generation
export interface DraftRequest {
  user_id: string;
  idea: string;
  num_variations?: number;
  similarity_threshold?: number;
  top_k?: number;
}

export interface DraftResponse {
  drafts: string[];
  similar_tweets: SimilarTweet[];
  style_profile: UserStyleProfile | null;
  confidence: number;
}

// Twitter API types
export interface TwitterCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

// Service configuration
export interface ServiceConfig {
  qdrant: {
    url: string;
    apiKey?: string;
    collection: string;
  };
  openai: {
    apiKey: string;
    model: string;
    embeddingModel: string;
  };
  twitter: TwitterCredentials;
}
