import 'dotenv/config';
import express from 'express';
import { TwitterService } from './services/twitter.service.js';
import { QdrantService } from './services/qdrant.service.js';
import { EmbeddingService } from './services/embedding.service.js';
import { DraftGeneratorService } from './services/draftGenerator.service.js';
import { initializeDatabase } from './db/client.js';
import { createTweetsRouter } from './routes/tweets.routes.js';
import { createDraftsRouter } from './routes/drafts.routes.js';
import { createManualRouter } from './routes/manual.routes.js';

async function main() {
  try {
    console.log('🚀 Starting PW-V2 Server...\n');

    // Validate environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'QDRANT_URL',
      'OPENAI_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Twitter credentials validation (Bearer Token OR OAuth 1.0a)
    const hasBearerToken = !!process.env.TWITTER_BEARER_TOKEN;
    const hasOAuth = !!(
      process.env.TWITTER_APP_KEY &&
      process.env.TWITTER_APP_SECRET &&
      process.env.TWITTER_ACCESS_TOKEN &&
      process.env.TWITTER_ACCESS_SECRET
    );

    if (!hasBearerToken && !hasOAuth) {
      throw new Error(
        'Twitter credentials required: Set TWITTER_BEARER_TOKEN or all OAuth 1.0a credentials (TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET)'
      );
    }

    // Initialize database
    console.log('📊 Initializing database...');
    await initializeDatabase();

    // Initialize services
    console.log('⚙️  Initializing services...');

    const twitterService = hasBearerToken
      ? new TwitterService(process.env.TWITTER_BEARER_TOKEN!)
      : new TwitterService({
          appKey: process.env.TWITTER_APP_KEY!,
          appSecret: process.env.TWITTER_APP_SECRET!,
          accessToken: process.env.TWITTER_ACCESS_TOKEN!,
          accessSecret: process.env.TWITTER_ACCESS_SECRET!
        });

    console.log(`✓ Twitter auth: ${hasBearerToken ? 'Bearer Token' : 'OAuth 1.0a'}`);

    const qdrantService = new QdrantService(
      process.env.QDRANT_URL!,
      'user_tweets',
      process.env.QDRANT_API_KEY
    );

    await qdrantService.initializeCollection();

    const embeddingService = new EmbeddingService(
      process.env.OPENAI_API_KEY!,
      'text-embedding-3-small'
    );

    const draftGenerator = new DraftGeneratorService(
      process.env.OPENAI_API_KEY!,
      qdrantService,
      embeddingService,
      'gpt-4o-mini'
    );

    // Initialize Express
    const app = express();
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      });
    });

    // Routes
    app.use('/api/tweets', createTweetsRouter(twitterService, embeddingService, qdrantService));
    app.use('/api/drafts', createDraftsRouter(draftGenerator));
    app.use('/api/manual', createManualRouter(embeddingService, qdrantService));

    // Error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        details: err.message
      });
    });

    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`\n📚 API Endpoints:`);
      console.log(`   POST   /api/manual/add-tweets           - Manually add tweets (no Twitter API)`);
      console.log(`   POST   /api/manual/quick-add            - Quick add 5 tweets`);
      console.log(`   POST   /api/tweets/collect-by-username  - Collect tweets by username (auto)`);
      console.log(`   POST   /api/tweets/collect              - Collect user tweets`);
      console.log(`   GET    /api/tweets/:user_id      - Get stored tweets`);
      console.log(`   DELETE /api/tweets/:user_id      - Delete user tweets`);
      console.log(`   POST   /api/drafts/generate      - Generate tweet drafts`);
      console.log(`   POST   /api/drafts/regenerate    - Regenerate drafts`);
      console.log(`   GET    /api/drafts/:user_id      - Get draft history`);
      console.log(`   GET    /api/drafts/:user_id/profile - Get style profile`);
      console.log(`   GET    /health                   - Health check\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
