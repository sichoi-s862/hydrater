# PW-V2: Personalized Tweet Generator

Embedding-based personalized writing system that generates tweets matching your unique style.

## Architecture

**V2 Enhancement**: Uses vector embeddings to find similar past tweets and uses them as few-shot examples for AI generation.

```
User Idea → Embedding → Qdrant Search → Similar Tweets → LLM Prompt → Personalized Drafts
```

## Features

- 🎯 **Style Matching**: Analyzes your past tweets to learn your writing style
- 🔍 **Semantic Search**: Finds similar tweets using vector embeddings (Qdrant + OpenAI)
- 🤖 **AI Generation**: Creates 3-5 variations using GPT-4 with example-based prompting
- 📊 **Engagement Tracking**: Prioritizes high-engagement tweet examples
- 💾 **Hybrid Storage**: PostgreSQL for relational data + Qdrant for vector search

## Prerequisites

- Node.js >= 18
- PostgreSQL database
- Qdrant vector database
- Twitter Developer Account (API V2 access)
- OpenAI API key

## Installation

```bash
# Install dependencies
yarn install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pw_v2

# Qdrant
QDRANT_URL=http://localhost:6333

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Twitter API (OAuth 1.0a)
TWITTER_APP_KEY=your_app_key
TWITTER_APP_SECRET=your_app_secret
TWITTER_ACCESS_TOKEN=user_access_token
TWITTER_ACCESS_SECRET=user_access_secret

# Server
PORT=3001
```

## Quick Start

### 1. Start Services

```bash
# PostgreSQL (if not running)
# brew services start postgresql

# Qdrant (Docker)
docker run -p 6333:6333 qdrant/qdrant

# Or use Qdrant Cloud (update QDRANT_URL in .env)
```

### 2. Run Development Server

```bash
yarn dev
```

### 3. Collect Your Tweets

```bash
curl -X POST http://localhost:3001/api/tweets/collect \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_TWITTER_USER_ID",
    "max_tweets": 100
  }'
```

**Get your Twitter User ID**: https://tweeterid.com/

### 4. Generate Tweet Drafts

```bash
curl -X POST http://localhost:3001/api/drafts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_TWITTER_USER_ID",
    "idea": "Shipping builds momentum. Momentum builds confidence.",
    "num_variations": 3
  }'
```

## API Endpoints

### Tweet Collection

**POST /api/tweets/collect**
```json
{
  "user_id": "123456789",
  "max_tweets": 100
}
```

**GET /api/tweets/:user_id**
```
Query params: ?limit=50&offset=0
```

**DELETE /api/tweets/:user_id**
```
Deletes all tweets and embeddings for user
```

### Draft Generation

**POST /api/drafts/generate**
```json
{
  "user_id": "123456789",
  "idea": "Your tweet idea here",
  "num_variations": 3,
  "top_k": 5
}
```

Response:
```json
{
  "success": true,
  "drafts": [
    "Generated tweet 1...",
    "Generated tweet 2...",
    "Generated tweet 3..."
  ],
  "metadata": {
    "similar_tweets_count": 5,
    "similar_tweets": [...],
    "style_profile": {...},
    "confidence": "0.847"
  }
}
```

**POST /api/drafts/regenerate**
```json
{
  "user_id": "123456789",
  "idea": "Your tweet idea",
  "previous_drafts": ["Draft 1", "Draft 2"]
}
```

**GET /api/drafts/:user_id**
```
Get draft history with pagination
```

**GET /api/drafts/:user_id/profile**
```
Get user's writing style profile
```

## How It Works

### 1. Tweet Collection
- Fetches last N tweets via Twitter API V2
- Extracts metadata (emoji usage, hashtags, length, engagement)
- Generates 1536-dim embeddings using OpenAI `text-embedding-3-small`
- Stores vectors in Qdrant for similarity search
- Stores relational data in PostgreSQL

### 2. Style Analysis
- Calculates average tweet length
- Measures emoji/hashtag frequency
- Infers tone and sentence structure
- Stores in `user_style_profiles` table

### 3. Draft Generation
```
1. Idea → Embedding (OpenAI)
2. Vector Search → Top K similar tweets (Qdrant)
3. Build Prompt:
   - Examples: K similar tweets
   - Style Profile: tone, length, patterns
   - Instructions: match user style exactly
4. LLM Generation (GPT-4, temperature=0.8)
5. Return 3 variations
```

### Example Prompt Structure

```
You are an AI that writes tweets in the exact same style as the user.

<EXAMPLES_START>
Tweet 1 (similarity: 0.89)
Tweet 2 (similarity: 0.85)
Tweet 3 (similarity: 0.82)
<EXAMPLES_END>

Writing Style:
- Casual and direct tone
- Average 120 characters
- 1-2 sentences
- Occasionally uses emojis (🔥💡)
- Rarely uses hashtags

Idea: "Shipping matters more than planning"

Generate 3 variations matching the user's style...
```

## Project Structure

```
src/
├── db/
│   ├── client.ts          # PostgreSQL connection
│   └── schema.sql         # Database schema
├── services/
│   ├── twitter.service.ts    # Twitter API V2 client
│   ├── embedding.service.ts  # OpenAI embeddings
│   ├── qdrant.service.ts     # Vector operations
│   └── draftGenerator.service.ts  # Draft generation logic
├── routes/
│   ├── tweets.routes.ts   # Tweet collection endpoints
│   └── drafts.routes.ts   # Draft generation endpoints
├── types/
│   └── index.ts           # TypeScript types
└── index.ts               # Main server

docs/                      # Official API documentation
├── qdrant-js-client.md
├── qdrant-operations.md
├── openai-embeddings.md
└── twitter-api-v2.md
```

## Database Schema

### user_tweets
```sql
- id, user_id, tweet_id
- text, created_at
- engagement_score
- has_emoji, has_hashtag, length
- qdrant_point_id (UUID)
```

### user_style_profiles
```sql
- user_id (unique)
- avg_length, emoji_frequency, hashtag_frequency
- tone, sentence_structure
- updated_at
```

### drafts
```sql
- id, user_id
- idea_text, generated_text
- similar_tweet_ids[], confidence_score
- created_at
```

## Cost Optimization

### OpenAI Costs
- **Embeddings**: `text-embedding-3-small` (~$0.02 per 1M tokens)
  - 100 tweets = ~$0.002
- **Generation**: `gpt-4` (~$0.03 per 1K tokens)
  - 1 draft generation = ~$0.01

### Recommendations
- Collect tweets once, reuse embeddings
- Cache style profiles
- Use `gpt-3.5-turbo` for lower cost (change in `.env`)

## Development

```bash
# Development with hot reload
yarn dev

# Type check
yarn typecheck

# Build for production
yarn build

# Run production
yarn start
```

## Troubleshooting

### Twitter API Errors

**401 Unauthorized**:
- Verify OAuth 1.0a credentials in `.env`
- Check Twitter Developer Portal app permissions

**429 Rate Limit**:
- Wait 15 minutes for rate limit reset
- Reduce `max_tweets` parameter

### Qdrant Connection Issues

```bash
# Check Qdrant is running
curl http://localhost:6333/collections

# Restart Qdrant
docker restart <qdrant_container_id>
```

### Database Issues

```bash
# Check PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Reinitialize schema
psql $DATABASE_URL < src/db/schema.sql
```

## Production Deployment

### Recommended Stack
- **Backend**: Railway, Render, or Fly.io
- **Database**: Supabase (PostgreSQL) or Railway
- **Qdrant**: Qdrant Cloud (free tier available)

### Environment Setup
1. Create PostgreSQL database
2. Sign up for Qdrant Cloud
3. Set production environment variables
4. Deploy with `yarn build && yarn start`

## Future Improvements

- [ ] Multi-user authentication system
- [ ] Tweet scheduling and publishing
- [ ] A/B testing for draft variations
- [ ] Advanced style customization (tone, emoji density)
- [ ] Support for threads (multi-tweet generation)
- [ ] Analytics dashboard (engagement predictions)
- [ ] Fine-tuned model for better style matching

## License

MIT

## Credits

Built with:
- [twitter-api-v2](https://github.com/plhery/node-twitter-api-v2)
- [Qdrant](https://qdrant.tech/)
- [OpenAI](https://platform.openai.com/)
