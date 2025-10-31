# Hydrater

X (Twitter) content automation platform that helps users generate and publish posts aligned with their interests and brand voice using AI.

## Features

- **X OAuth Authentication**: Secure login with X (Twitter) account
- **User Profile Management**: Set interests, brand direction, and author style
- **Tendency Analysis**: Analyze your posting patterns and engagement from past tweets
- **Content Crawling**: Automatically discover relevant news and trending topics
- **AI-Powered Draft Generation**: Create multiple post drafts using OpenAI
- **Draft Management**: Edit, regenerate, and manage drafts before publishing
- **One-Click Publishing**: Post directly to X from the dashboard

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL
- **Authentication**: Passport.js with Twitter OAuth
- **AI**: OpenAI GPT-4 API
- **Social API**: Twitter API v2
- **Content Crawling**: Axios + Cheerio

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- X (Twitter) Developer Account with API credentials
- OpenAI API key

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd hydrater
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb hydrater
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `TWITTER_CONSUMER_KEY`: X API consumer key
- `TWITTER_CONSUMER_SECRET`: X API consumer secret
- `TWITTER_CALLBACK_URL`: OAuth callback URL (e.g., http://localhost:3000/auth/twitter/callback)
- `OPENAI_API_KEY`: OpenAI API key
- `SESSION_SECRET`: Random secret for session management

### 4. Getting X (Twitter) API Credentials

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use existing app
3. Enable OAuth 1.0a authentication
4. Set callback URL to `http://localhost:3000/auth/twitter/callback`
5. Copy Consumer Key and Consumer Secret to `.env`

### 5. Initialize Database

The database schema will be automatically initialized when you start the server for the first time.

### 6. Run the Application

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### 1. Login

- Navigate to `http://localhost:3000`
- Click "Login with X" to authenticate

### 2. Setup Your Profile

- Fill in your interests (comma-separated)
- Describe your brand direction
- Define your author style
- Set target audience and tone

### 3. Analyze Your Posting Style

- Click "Analyze My Posting Style" to analyze your past tweets
- The system will identify your common topics, posting frequency, and style markers

### 4. Generate Drafts

- Click "Generate Drafts" to create AI-powered post suggestions
- The system will:
  - Crawl relevant news based on your interests
  - Analyze your posting patterns
  - Generate 3 unique drafts matching your style

### 5. Manage Drafts

- **Edit**: Modify the draft text
- **Regenerate**: Create a new version
- **Publish**: Post directly to X
- **Delete**: Remove unwanted drafts

### 6. Filter Drafts

Use the tabs to filter drafts by status:
- All
- Generated
- Edited
- Published

## API Endpoints

### Authentication

- `GET /auth/twitter` - Initiate X OAuth
- `GET /auth/twitter/callback` - OAuth callback
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout

### User Profile

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Drafts

- `POST /api/drafts/generate` - Generate new drafts
- `GET /api/drafts` - Get all drafts (optional `?status=` filter)
- `GET /api/drafts/:id` - Get single draft
- `PUT /api/drafts/:id` - Update draft
- `POST /api/drafts/:id/regenerate` - Regenerate draft
- `POST /api/drafts/:id/publish` - Publish draft to X
- `DELETE /api/drafts/:id` - Delete draft
- `POST /api/drafts/crawl` - Trigger content crawling
- `POST /api/drafts/analyze` - Trigger tendency analysis

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Database Migration

If you need to reinitialize the database:

```bash
npm run db:migrate
```

## Project Structure

```
hydrater/
├── src/
│   ├── index.ts              # Application entry point
│   ├── types/                # TypeScript type definitions
│   ├── db/                   # Database configuration and schema
│   ├── models/               # Data models (User, Draft)
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   │   ├── crawler.ts        # Content crawling
│   │   ├── tendencyAnalyzer.ts  # Posting style analysis
│   │   └── draftGenerator.ts    # AI draft generation
│   └── middleware/           # Express middleware (auth)
├── public/                   # Frontend files
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Troubleshooting

### Database Connection Issues

Make sure PostgreSQL is running and the `DATABASE_URL` is correct:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Twitter API Errors

- Ensure your app has OAuth 1.0a enabled
- Check callback URL matches exactly
- Verify API credentials are correct

### OpenAI API Errors

- Check API key is valid
- Ensure you have sufficient credits
- Monitor rate limits

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
