# Database Schema Documentation

## Overview

Hydrater uses PostgreSQL as its primary database for storing user profiles, X (Twitter) OAuth credentials, draft posts, crawled content, and user posting tendency analysis. The schema is designed to support the content generation pipeline with efficient indexing and referential integrity.

## Database Configuration

### Connection
- **Library**: `pg` (node-postgres) with connection pooling
- **Configuration**: `src/db/connection.ts`
- **Environment Variable**: `DATABASE_URL`
- **Connection String Format**: `postgresql://username:password@host:port/database`

### Initialization
- **Schema File**: `src/db/schema.sql`
- **Auto-initialization**: Runs on first server start via `src/db/init.ts`
- **Manual Reset**: `npm run db:migrate`

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ 1:N
       │
       ├─────────────────┐
       │                 │
       ├─────────────┐   │
       │             │   │
       ▼             ▼   ▼
┌─────────┐   ┌──────────────────┐   ┌───────────────────┐
│ drafts  │   │ tendency_analysis│   │user_crawled_content│
└─────────┘   └──────────────────┘   └─────────┬─────────┘
                                                 │
                                                 │ N:1
                                                 ▼
                                      ┌────────────────────┐
                                      │ crawled_content    │
                                      └────────────────────┘
```

## Tables

### 1. users

Stores user account information and X (Twitter) OAuth credentials.

**Purpose**: Central user management with OAuth tokens for API access and user preferences for content personalization.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `twitter_id` | VARCHAR(255) | UNIQUE, NOT NULL | X (Twitter) user ID from OAuth |
| `username` | VARCHAR(255) | NOT NULL | X username (handle) |
| `display_name` | VARCHAR(255) | NOT NULL | User's display name on X |
| `profile_image_url` | TEXT | NULL | URL to user's profile image |
| `access_token` | TEXT | NOT NULL | OAuth 1.0a access token |
| `access_token_secret` | TEXT | NOT NULL | OAuth 1.0a access token secret |
| `interests` | TEXT[] | DEFAULT '{}' | User-defined topics of interest (array) |
| `brand_direction` | TEXT | NULL | Brand positioning and messaging direction |
| `author_style` | TEXT | NULL | Desired writing style and voice |
| `target_audience` | TEXT | NULL | Intended audience description |
| `tone` | TEXT | NULL | Preferred tone (e.g., professional, casual, humorous) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last profile update (auto-updated via trigger) |

#### Indexes
- `idx_users_twitter_id` on `twitter_id` - Fast lookup during OAuth authentication

#### Relationships
- **One-to-Many**: `users` → `drafts` (CASCADE DELETE)
- **One-to-Many**: `users` → `tendency_analysis` (CASCADE DELETE)
- **Many-to-Many**: `users` ↔ `crawled_content` via `user_crawled_content` (CASCADE DELETE)

#### Business Logic
- OAuth tokens are encrypted in transit and stored securely
- `interests` array is used by ContentCrawler for relevance scoring
- `brand_direction`, `author_style`, `tone`, `target_audience` are fed into OpenAI prompts
- Profile updates trigger `updated_at` timestamp via database trigger

---

### 2. drafts

Stores AI-generated post drafts throughout their lifecycle.

**Purpose**: Track draft posts from generation through editing to publication with full audit trail.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique draft identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner of the draft |
| `content` | TEXT | NOT NULL | Original AI-generated post content |
| `source_urls` | TEXT[] | DEFAULT '{}' | URLs of news articles used as source material |
| `status` | VARCHAR(50) | DEFAULT 'generated' | Draft lifecycle status |
| `edited_content` | TEXT | NULL | User-modified version (NULL if not edited) |
| `published_at` | TIMESTAMP | NULL | Timestamp when posted to X |
| `tweet_id` | VARCHAR(255) | NULL | X (Twitter) post ID after publication |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Draft generation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification (auto-updated via trigger) |

#### Status Values

| Status | Meaning | Typical Transition |
|--------|---------|-------------------|
| `generated` | Fresh AI output, not yet reviewed | → `reviewed`, `edited`, `archived` |
| `reviewed` | User viewed but did not modify | → `edited`, `published`, `archived` |
| `edited` | User modified content (stored in `edited_content`) | → `published`, `archived` |
| `published` | Posted to X (has `tweet_id` and `published_at`) | → `archived` |
| `archived` | Soft-deleted or expired | Terminal state |

#### Indexes
- `idx_drafts_user_id` on `user_id` - Fast user-specific draft queries
- `idx_drafts_status` on `status` - Efficient filtering by status

#### Relationships
- **Many-to-One**: `drafts` → `users` (CASCADE DELETE when user is deleted)

#### Business Logic
- `edited_content` preserves original `content` for comparison/rollback
- `source_urls` links drafts back to crawled news articles for attribution
- Status transitions are enforced at application level (see CLAUDE.md)
- Published drafts are immutable (no further edits allowed)

---

### 3. crawled_content

Stores news articles and content discovered by ContentCrawler.

**Purpose**: Central repository of crawled news with deduplication and relevance tracking.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique content identifier |
| `title` | TEXT | NOT NULL | Article headline |
| `url` | TEXT | UNIQUE, NOT NULL | Article URL (deduplication key) |
| `summary` | TEXT | NULL | Article summary or excerpt (max 500 chars) |
| `source` | VARCHAR(255) | NULL | Source name (e.g., "TechCrunch", "Hacker News") |
| `published_date` | TIMESTAMP | NULL | Original publication date from source |
| `relevance_score` | DECIMAL(3,2) | NULL | Base relevance score (0.00-1.00) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When content was crawled |

#### Indexes
- `idx_crawled_content_created_at` on `created_at DESC` - Recent content queries
- `UNIQUE` constraint on `url` - Prevents duplicate crawling

#### Relationships
- **Many-to-Many**: `crawled_content` ↔ `users` via `user_crawled_content`

#### Business Logic
- `url` uniqueness ensures no duplicate articles
- `relevance_score` is a base score; user-specific scores stored in junction table
- Content older than 30 days may be archived (application-level policy)
- `ON CONFLICT (url) DO UPDATE` pattern for crawl refreshes

---

### 4. user_crawled_content

Junction table linking users to relevant crawled content with personalized scoring.

**Purpose**: Many-to-many relationship with user-specific relevance scores for content filtering.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | REFERENCES users(id) ON DELETE CASCADE | User reference |
| `content_id` | UUID | REFERENCES crawled_content(id) ON DELETE CASCADE | Content reference |
| `relevance_score` | DECIMAL(3,2) | NULL | User-specific relevance (0.00-1.00) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When content was linked to user |
| **Primary Key** | | `(user_id, content_id)` | Composite key prevents duplicates |

#### Relationships
- **Many-to-One**: `user_crawled_content` → `users` (CASCADE DELETE)
- **Many-to-One**: `user_crawled_content` → `crawled_content` (CASCADE DELETE)

#### Business Logic
- `relevance_score` calculated by matching content against user's `interests`
- Only content with score > 0.3 is stored (filtering threshold)
- Used to fetch recent relevant news for draft generation
- `ON CONFLICT (user_id, content_id) DO UPDATE` for score refreshes

---

### 5. tendency_analysis

Stores analysis of user's posting patterns from historical X posts.

**Purpose**: Capture posting style, frequency, topics, and engagement patterns for content personalization.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique analysis identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User being analyzed |
| `common_topics` | TEXT[] | NULL | Top hashtags and keywords from past posts |
| `posting_frequency` | VARCHAR(50) | NULL | Frequency category (very_active, active, moderate, occasional) |
| `engagement_patterns` | JSONB | NULL | Engagement metrics (avgLikes, avgRetweets, avgReplies, totalEngagement) |
| `style_markers` | TEXT[] | NULL | Detected style markers (emoji-heavy, question-based, enthusiastic, conversational) |
| `analyzed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Analysis timestamp |

#### Posting Frequency Categories

| Value | Tweets per Day | Description |
|-------|----------------|-------------|
| `very_active` | > 5 | Multiple daily posts |
| `active` | 2-5 | Daily to multiple times per day |
| `moderate` | 0.5-2 | Few times per week |
| `occasional` | < 0.5 | Sporadic posting |
| `insufficient_data` | N/A | < 2 tweets analyzed |

#### Style Markers

Calculated from tweet text patterns:

| Marker | Threshold | Description |
|--------|-----------|-------------|
| `emoji-heavy` | > 50% of tweets | Frequent emoji usage |
| `question-based` | > 30% of tweets | Posts often pose questions |
| `enthusiastic` | > 40% of tweets | Frequent exclamation marks |
| `conversational` | > 30% of tweets | High @mention usage |

#### Engagement Patterns (JSONB)

```json
{
  "avgLikes": 12.5,
  "avgRetweets": 3.2,
  "avgReplies": 1.8,
  "totalEngagement": 1750
}
```

#### Indexes
- `idx_tendency_analysis_user_id` on `user_id` - Fast lookup of latest analysis

#### Relationships
- **Many-to-One**: `tendency_analysis` → `users` (CASCADE DELETE)

#### Business Logic
- Analysis based on user's last 100 tweets via Twitter API v2
- Multiple analyses stored per user (historical record)
- Latest analysis retrieved via `ORDER BY analyzed_at DESC LIMIT 1`
- Used in OpenAI prompt construction for style matching
- Reanalysis triggered manually or after significant time gap

---

## Database Triggers

### update_updated_at_column()

**Purpose**: Automatically update `updated_at` timestamp on row modifications.

**Applied To**:
- `users` table
- `drafts` table

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Behavior**:
- Fires `BEFORE UPDATE` on each row
- Sets `updated_at` to current timestamp
- Happens automatically, no application code needed

---

## Common Queries

### Get User with Latest Analysis
```sql
SELECT
  u.*,
  ta.common_topics,
  ta.posting_frequency,
  ta.style_markers
FROM users u
LEFT JOIN LATERAL (
  SELECT * FROM tendency_analysis
  WHERE user_id = u.id
  ORDER BY analyzed_at DESC
  LIMIT 1
) ta ON true
WHERE u.id = $1;
```

### Get Recent Relevant Content for User
```sql
SELECT
  c.*,
  ucc.relevance_score as user_relevance
FROM crawled_content c
INNER JOIN user_crawled_content ucc ON c.id = ucc.content_id
WHERE ucc.user_id = $1
ORDER BY c.created_at DESC, ucc.relevance_score DESC
LIMIT 10;
```

### Get Drafts by Status
```sql
SELECT * FROM drafts
WHERE user_id = $1 AND status = $2
ORDER BY created_at DESC;
```

### Upsert Crawled Content
```sql
INSERT INTO crawled_content (title, url, summary, source, published_date, relevance_score)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (url) DO UPDATE
SET relevance_score = EXCLUDED.relevance_score
RETURNING *;
```

---

## Performance Considerations

### Indexes
All critical access patterns are indexed:
- User lookup by Twitter ID (authentication)
- Draft queries by user and status (dashboard views)
- Recent content queries with descending timestamp
- Tendency analysis by user (latest analysis retrieval)

### Connection Pooling
- `pg.Pool` maintains persistent connections
- Default pool size: 10 connections
- Prevents connection exhaustion under load

### Cascade Deletes
- User deletion removes all related data automatically
- Maintains referential integrity without orphaned records
- Reduces application-level cleanup code

### Array and JSONB Columns
- `TEXT[]` for interests, topics, style_markers (efficient indexing)
- `JSONB` for engagement_patterns (flexible schema, queryable)
- Both support native PostgreSQL operators for querying

---

## Data Retention and Privacy

### Sensitive Data
- OAuth tokens stored in `users.access_token` and `access_token_secret`
- Should be encrypted at rest (consider pgcrypto extension)
- Never logged or exposed in API responses

### User Data Deletion
- Cascading deletes ensure complete data removal
- User can request account deletion via application
- All drafts, analyses, and content links are removed

### Content Freshness
- Crawled content older than 30 days may be archived
- Stale analyses can be refreshed on demand
- Draft retention policy: published drafts kept for 90 days

---

## Migration Strategy

### Schema Changes
1. Add migration SQL files in `src/db/migrations/`
2. Use transaction blocks for atomic changes
3. Test on development database first
4. Apply with `npm run db:migrate`

### Backup Recommendations
```bash
# Backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
psql $DATABASE_URL < backup_file.sql
```

### Common Migration Patterns

#### Adding a Column
```sql
ALTER TABLE users ADD COLUMN new_field TEXT;
```

#### Adding an Index
```sql
CREATE INDEX CONCURRENTLY idx_new_field ON users(new_field);
```

#### Modifying a Column (safe)
```sql
ALTER TABLE users ALTER COLUMN interests SET DEFAULT '{"general"}';
```

---

## Troubleshooting

### Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()"
```

### Schema Reset
```bash
# Drop all tables (DESTRUCTIVE)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Reinitialize schema
npm run db:migrate
```

### Query Performance
```sql
-- Explain query plan
EXPLAIN ANALYZE SELECT * FROM drafts WHERE user_id = '...';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

---

## Future Enhancements

### Potential Schema Additions
- **draft_versions**: Track edit history for drafts
- **scheduled_posts**: Queue drafts for future publishing
- **analytics**: Track post performance metrics after publication
- **tags**: User-defined tags for draft organization
- **templates**: Reusable post templates

### Performance Optimizations
- Partitioning `crawled_content` by date for large datasets
- Materialized views for complex analytics queries
- Full-text search indexes on content and summaries
- Read replicas for scaling read-heavy operations
