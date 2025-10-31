-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  profile_image_url TEXT,
  access_token TEXT NOT NULL,
  access_token_secret TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  brand_direction TEXT,
  author_style TEXT,
  target_audience TEXT,
  tone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_urls TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'generated',
  edited_content TEXT,
  published_at TIMESTAMP,
  tweet_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crawled content table
CREATE TABLE IF NOT EXISTS crawled_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  summary TEXT,
  source VARCHAR(255),
  published_date TIMESTAMP,
  relevance_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User content mapping (many-to-many)
CREATE TABLE IF NOT EXISTS user_crawled_content (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES crawled_content(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, content_id)
);

-- Tendency analysis table
CREATE TABLE IF NOT EXISTS tendency_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  common_topics TEXT[],
  posting_frequency VARCHAR(50),
  engagement_patterns JSONB,
  style_markers TEXT[],
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_crawled_content_created_at ON crawled_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tendency_analysis_user_id ON tendency_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_users_twitter_id ON users(twitter_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to drafts table
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
