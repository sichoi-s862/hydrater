# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hydrater is an X (Twitter) content automation platform that helps users generate and publish posts aligned with their interests and brand voice. The system analyzes user preferences, crawls relevant content, and generates draft posts using AI.

## Common Development Commands

### Backend (Node.js + TypeScript + Express)
```bash
npm run dev              # Start backend dev server with hot reload (port 3000)
npm run build            # Compile TypeScript for both backend and frontend
npm run build:server     # Compile backend TypeScript only
npm start                # Run compiled backend in production mode
npm test                 # Run Jest tests
npm run lint             # Run ESLint on backend code
npm run db:migrate       # Reinitialize database schema
npm run install:all      # Install dependencies for both backend and frontend
```

### Frontend (React + TypeScript + Vite)
```bash
cd client
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build frontend for production
npm run preview          # Preview production build
npm run lint             # Run ESLint on frontend code
npm run test:e2e         # Run Playwright end-to-end tests
npm run test:e2e:ui      # Run Playwright with UI
npm run test:e2e:report  # Show Playwright test report
```

### Full Stack Development
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run dev:client

# Or build everything
npm run build  # Builds both server and client
```

## Core Architecture

### Monorepo Structure
The project is a monorepo with separate backend and frontend workspaces:
- **Root**: Express backend (TypeScript)
- **client/**: React frontend (TypeScript + Vite + Emotion)

### Authentication & User Management
- **X OAuth 1.0a Flow**: Passport.js with passport-twitter strategy
- **Session Management**: express-session with secure cookie configuration
- **Token Storage**: User's X OAuth tokens stored in PostgreSQL for API access

### Content Pipeline Architecture

The system orchestrates three core services that work together:

1. **TendencyAnalyzer** (`src/services/tendencyAnalyzer.ts`)
   - Fetches user's last 100 tweets via Twitter API v2
   - Extracts topics (hashtags + keywords), posting frequency, engagement patterns
   - Calculates style markers (emoji-heavy, question-based, enthusiastic, conversational)
   - Stores analysis in `tendency_analysis` table

2. **ContentCrawler** (`src/services/crawler.ts`)
   - Crawls RSS feeds (TechCrunch) and web pages (Hacker News)
   - Calculates relevance scores by matching content to user interests
   - Stores in `crawled_content` with many-to-many relationship via `user_crawled_content`
   - Filters content with relevance > 0.3

3. **DraftGenerator** (`src/services/draftGenerator.ts`)
   - Coordinates TendencyAnalyzer and ContentCrawler
   - Builds comprehensive OpenAI prompts with user profile, posting patterns, and recent news
   - Generates multiple draft variations (GPT-4, temperature 0.8)
   - Stores drafts with lifecycle status tracking

### Database Schema

**Key Tables**:
- `users`: X OAuth credentials, profile preferences (interests, brand_direction, author_style)
- `drafts`: Post content, status (generated/reviewed/edited/published), source URLs
- `tendency_analysis`: User posting patterns and style analysis
- `crawled_content`: News articles with relevance scores
- `user_crawled_content`: Many-to-many link with user-specific relevance

### Frontend Architecture (React)

**Structure**:
- `src/components/`: Organized by feature (Auth, Draft, Profile, Common)
- `src/context/`: AuthContext for global authentication state
- `src/services/api.ts`: Centralized API service layer
- `src/pages/`: Page-level components with routing
- **Styling**: Emotion CSS-in-JS with centralized theme (`src/theme.ts`)

**Key Features**:
- Protected routes requiring authentication
- Draft status filtering and management
- Inline editing with optimistic updates
- Vite proxy to backend in development (port 3000)

## Key Integration Points

### X (Twitter) API
- **Authentication**: OAuth 1.0a with passport-twitter
- **User Timeline**: v2.userTimeline endpoint for tendency analysis (max 100 tweets)
- **Publishing**: twitter-api-v2 client for posting tweets
- **Credentials**: TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET in .env

### OpenAI API
- **Model**: GPT-4 for draft generation
- **Temperature**: 0.8 for creative variation (0.9 for regeneration)
- **Prompt Structure**: User profile + posting patterns + news content + requirements
- **Character Limit**: Enforces 280-character Twitter limit

### PostgreSQL Database
- **Connection**: pg library with connection pooling
- **Initialization**: Automatic schema creation from `src/db/schema.sql` on first run
- **Environment**: DATABASE_URL in .env

## Draft Lifecycle

Draft status transitions follow this flow:
```
generated → [reviewed] → edited → published
     ↓           ↓                    ↓
  archived    archived            archived
```

**Status Meanings**:
- `generated`: AI-created, not yet reviewed
- `reviewed`: User viewed but not modified
- `edited`: User modified the content (stored in `edited_content`)
- `published`: Posted to X (stores `tweet_id` and `published_at`)
- `archived`: Soft-deleted

## API Endpoint Patterns

**Authentication**: `/auth/*`
- X OAuth flow, callback, logout, status check

**User Profile**: `/api/user/*`
- GET/PUT profile (requires authentication middleware)

**Drafts**: `/api/drafts/*`
- CRUD operations with status filtering
- Special actions: `/analyze`, `/crawl`, `/:id/regenerate`, `/:id/publish`

## Development Workflow Notes

### Environment Variables
Required in `.env`:
- Database: `DATABASE_URL`
- Twitter: `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_CALLBACK_URL`
- OpenAI: `OPENAI_API_KEY`
- Session: `SESSION_SECRET`
- Optional: `FRONTEND_URL` (default: http://localhost:5173)

### Testing
- **Backend**: Jest for unit tests
- **Frontend**: Playwright for E2E tests in `client/tests/`
- E2E tests verify auth flow and UI components with Emotion styling

### Production Build
The backend serves the compiled React frontend when `NODE_ENV=production`:
- Frontend builds to `client/dist/`
- Express serves static files and handles client-side routing with catch-all

### Adding New Features

When extending the content pipeline:
1. Service changes go in `src/services/`
2. Update TypeScript types in `src/types/index.ts`
3. Add database migrations via `src/db/schema.sql`
4. Create corresponding API routes in `src/routes/`
5. Update frontend API client in `client/src/services/api.ts`
6. Add React components in appropriate feature directory

### Content Crawling Extension

To add new news sources:
1. Add to `ContentCrawler.newsSources` array
2. Implement parsing logic (RSS or webpage scraping with Cheerio)
3. Ensure relevance scoring accounts for new source characteristics
