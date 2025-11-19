-- User tweets table (relational data)
CREATE TABLE IF NOT EXISTS user_tweets (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  tweet_id VARCHAR(255) UNIQUE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  engagement_score INTEGER DEFAULT 0,
  qdrant_point_id UUID,
  has_emoji BOOLEAN DEFAULT FALSE,
  has_hashtag BOOLEAN DEFAULT FALSE,
  length INTEGER,
  created_at_local TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tweets_user_id ON user_tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tweets_tweet_id ON user_tweets(tweet_id);
CREATE INDEX IF NOT EXISTS idx_user_tweets_created_at ON user_tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_tweets_engagement ON user_tweets(engagement_score DESC);

-- User style profiles (cached analysis)
CREATE TABLE IF NOT EXISTS user_style_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  avg_length INTEGER,
  emoji_frequency DECIMAL(3,2),
  hashtag_frequency DECIMAL(3,2),
  tone VARCHAR(50),
  sentence_structure VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_style_profiles_user_id ON user_style_profiles(user_id);

-- Generated drafts
CREATE TABLE IF NOT EXISTS drafts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  idea_text TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  similar_tweet_ids TEXT[],
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);
