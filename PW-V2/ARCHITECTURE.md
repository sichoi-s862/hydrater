# PW-V2 Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PW-V2 Architecture                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   User Request   │
│  "Generate tweet │
│   about X"       │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Express API Server                             │
├─────────────────────────────────────────────────────────────────────┤
│  Routes:                                                             │
│  • POST /api/tweets/collect    → Tweet Collection Pipeline          │
│  • POST /api/drafts/generate   → Draft Generation Pipeline          │
└────────┬────────────────────────────────────────────┬───────────────┘
         │                                             │
         ▼                                             ▼
┌──────────────────────────┐             ┌─────────────────────────┐
│  Tweet Collection Flow   │             │  Draft Generation Flow   │
└──────────────────────────┘             └─────────────────────────┘
```

## Tweet Collection Pipeline

```
1. User ID Input
   └─→ TwitterService.fetchUserTweets()
       └─→ Twitter API V2 (max 100 tweets per call)
           └─→ Filter: exclude retweets & replies
               └─→ Extract: text, metrics, created_at

2. Tweet Processing
   └─→ Detect emoji (regex pattern)
   └─→ Detect hashtags (entities.hashtags)
   └─→ Calculate engagement: likes + (retweets × 2)

3. Embedding Generation
   └─→ EmbeddingService.generateTweetEmbeddings()
       └─→ OpenAI API (text-embedding-3-small)
           └─→ Batch process (100 tweets per chunk)
           └─→ Returns: float[][] (1536 dimensions)

4. Storage
   ├─→ QdrantService.batchStoreTweetEmbeddings()
   │   └─→ Qdrant: Store vectors with payload
   │       └─→ Cosine similarity index
   │
   └─→ PostgreSQL: user_tweets table
       └─→ Store tweet text + metadata + qdrant_point_id

5. Style Profile Calculation
   └─→ Aggregate: avg_length, emoji_freq, hashtag_freq
       └─→ Store in: user_style_profiles table
```

## Draft Generation Pipeline

```
1. Idea Input + User ID
   └─→ EmbeddingService.generateEmbedding(idea)
       └─→ OpenAI: Convert idea to vector

2. Similarity Search
   └─→ QdrantService.findSimilarTweets()
       ├─→ Query vector: idea embedding
       ├─→ Filter: user_id match
       ├─→ Top K: 5 most similar tweets
       └─→ Returns: tweets + similarity scores

3. Context Building
   ├─→ Fetch style profile (PostgreSQL)
   └─→ Build prompt:
       ├─→ <EXAMPLES>: K similar tweets
       ├─→ <STYLE>: tone, length, patterns
       └─→ <TASK>: generate 3 variations

4. LLM Generation
   └─→ OpenAI GPT-4
       ├─→ Temperature: 0.8 (creative)
       ├─→ Max tokens: 500
       └─→ Returns: 3 tweet variations

5. Response + Storage
   ├─→ Calculate confidence (avg similarity)
   ├─→ Store in drafts table
   └─→ Return JSON response
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────┐       ┌──────────────────────────────┐
│    PostgreSQL       │       │         Qdrant DB            │
├─────────────────────┤       ├──────────────────────────────┤
│                     │       │  Collection: user_tweets     │
│ user_tweets         │◄─────►│  Vectors: 1536-dim          │
│ • id, tweet_id      │ link  │  Distance: Cosine           │
│ • text, metadata    │       │  Payload:                   │
│ • qdrant_point_id ──┼──────►│   • user_id, tweet_id       │
│                     │       │   • text, engagement        │
│ user_style_profiles │       │                             │
│ • avg_length        │       │  Query:                     │
│ • emoji_frequency   │       │   • Input: idea vector      │
│                     │       │   • Filter: user_id         │
│ drafts              │       │   • Output: top K tweets    │
│ • idea, generated   │       │                             │
│ • confidence        │       │                             │
└─────────────────────┘       └──────────────────────────────┘
```

## Service Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
└────────────────────────────────────────────────────────────────┘

TwitterService
├─ fetchUserTweets(userId, maxResults)
│  └─→ twitter-api-v2 library
│      └─→ v2.userTimeline()
└─ Features:
   ├─ Rate limit handling
   ├─ Emoji detection
   └─ Engagement calculation

EmbeddingService
├─ generateEmbedding(text)
├─ generateEmbeddings(texts[])
└─ Features:
   ├─ Text cleaning (newlines, whitespace)
   ├─ Batch processing (chunks of 100)
   └─ Rate limit protection

QdrantService
├─ initializeCollection()
├─ storeTweetEmbedding(userId, tweet, embedding)
├─ batchStoreTweetEmbeddings(userId, tweets[], embeddings[][])
└─ findSimilarTweets(userId, queryEmbedding, topK)
   └─→ Cosine similarity search with filtering

DraftGeneratorService
├─ generateDrafts(userId, idea, numVariations)
│  ├─→ 1. Generate idea embedding
│  ├─→ 2. Find similar tweets (Qdrant)
│  ├─→ 3. Build prompt with examples
│  ├─→ 4. Call GPT-4
│  └─→ 5. Return variations + metadata
└─ regenerate(userId, idea, previousDrafts[])
   └─→ Add negative examples to prompt
```

## API Layer

```
┌────────────────────────────────────────────────────────────────┐
│                         API Routes                              │
└────────────────────────────────────────────────────────────────┘

/api/tweets/*
├─ POST   /collect
│  └─→ Body: { user_id, max_tweets }
│      └─→ Trigger: Collection Pipeline
├─ GET    /:user_id
│  └─→ Query: ?limit=50&offset=0
│      └─→ Return: Stored tweets from PostgreSQL
└─ DELETE /:user_id
   └─→ Cleanup: Qdrant + PostgreSQL

/api/drafts/*
├─ POST   /generate
│  └─→ Body: { user_id, idea, num_variations, top_k }
│      └─→ Trigger: Generation Pipeline
│      └─→ Return: { drafts[], metadata }
├─ POST   /regenerate
│  └─→ Body: { user_id, idea, previous_drafts[] }
│      └─→ Return: New variations
├─ GET    /:user_id
│  └─→ Return: Draft history
└─ GET    /:user_id/profile
   └─→ Return: Style profile
```

## Key Design Decisions

### 1. Hybrid Storage (PostgreSQL + Qdrant)

**Why not just Qdrant?**
- Qdrant: Optimized for vector search (fast similarity queries)
- PostgreSQL: Better for relational queries, history tracking, transactions
- Link: `qdrant_point_id` UUID in PostgreSQL

**Trade-off**: Slight complexity vs. performance gains

### 2. Embedding Model: text-embedding-3-small

**Why not text-embedding-3-large?**
- 1536 dim vs 3072 dim
- 2x faster, 5x cheaper
- Sufficient accuracy for tweet similarity (short texts)

**Cost**: ~$0.002 per 100 tweets

### 3. Few-Shot Prompting with Examples

**Why not zero-shot?**
- Generic AI voice without examples
- Examples provide concrete style guidance
- Top K=5 similar tweets give strong signal

**Result**: Much better style matching than V1

### 4. Cosine Distance (not Euclidean/Dot)

**Why Cosine?**
- Normalized vectors from OpenAI
- Measures angle, not magnitude
- Better for text similarity

### 5. Twitter API V2 (not V1.1)

**Why V2?**
- Modern API with better rate limits
- Richer metadata (public_metrics, entities)
- V1.1 deprecated soon

## Performance Characteristics

### Latency
- **Tweet Collection** (100 tweets):
  - Twitter API: ~2-3 seconds
  - Embedding generation: ~5-10 seconds (batched)
  - Qdrant storage: ~1 second
  - **Total**: ~10-15 seconds

- **Draft Generation**:
  - Idea embedding: ~0.5 seconds
  - Qdrant search: ~0.1 seconds
  - GPT-4 generation: ~5-10 seconds
  - **Total**: ~6-11 seconds

### Scalability
- **Qdrant**: 10M+ vectors, <50ms search
- **PostgreSQL**: Standard OLTP workload
- **Bottleneck**: OpenAI API (rate limits)

### Cost Estimate (per user)
- Tweet collection (100 tweets):
  - Embeddings: $0.002
- Draft generation (10 drafts):
  - Embeddings: $0.0001
  - GPT-4: $0.10
- **Monthly** (100 drafts): ~$1-2 per user

## Error Handling

```
Twitter API Errors:
├─ 401: Auth failure → Check credentials
├─ 429: Rate limit → Wait 15 min
└─ 404: User not found → Invalid user_id

OpenAI API Errors:
├─ 401: Invalid key → Check OPENAI_API_KEY
├─ 429: Rate limit → Implement backoff
└─ 500: Server error → Retry with exponential backoff

Qdrant Errors:
├─ Connection refused → Check QDRANT_URL
├─ Collection not found → Run initializeCollection()
└─ Dimension mismatch → Verify embedding model

PostgreSQL Errors:
├─ Connection failed → Check DATABASE_URL
├─ Constraint violation → Handle duplicate tweet_id
└─ Schema missing → Run schema.sql
```

## Security Considerations

1. **API Keys**: Stored in environment variables (never committed)
2. **Database**: PostgreSQL with connection pooling
3. **Rate Limiting**: Not implemented yet (TODO)
4. **Input Validation**: Basic validation on API endpoints
5. **User Isolation**: Tweets filtered by user_id in Qdrant

## Future Architecture Improvements

1. **Caching Layer** (Redis):
   - Cache embeddings for frequently accessed tweets
   - Cache style profiles (TTL: 1 hour)

2. **Job Queue** (Bull/BullMQ):
   - Async tweet collection
   - Batch processing for multiple users

3. **Authentication** (Passport.js):
   - OAuth 2.0 flow for Twitter login
   - JWT tokens for API access

4. **Monitoring** (Prometheus + Grafana):
   - Track API latency
   - Monitor OpenAI costs
   - Alert on error rates

5. **Rate Limiting** (express-rate-limit):
   - Prevent abuse
   - Per-user quotas
