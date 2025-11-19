import { Router, Request, Response } from 'express';
import { TwitterService } from '../services/twitter.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { QdrantService } from '../services/qdrant.service.js';
import { query } from '../db/client.js';

export function createTweetsRouter(
  twitterService: TwitterService,
  embeddingService: EmbeddingService,
  qdrantService: QdrantService
) {
  const router = Router();

  /**
   * GET /tweets/me
   * Get authenticated user info and ID
   */
  router.get('/me', async (req: Request, res: Response) => {
    try {
      const user = await twitterService.getAuthenticatedUser();

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        },
        message: `Use this ID for collection: ${user.id}`
      });
    } catch (error: any) {
      console.error('Auth test error:', error);
      res.status(500).json({
        error: 'Failed to authenticate with Twitter',
        details: error.message,
        hint: 'Check your Twitter API credentials in .env'
      });
    }
  });

  /**
   * POST /tweets/collect-by-username
   * Collect tweets by username (auto-converts to user_id)
   */
  router.post('/collect-by-username', async (req: Request, res: Response) => {
    try {
      const { username, max_tweets = 20, save_as } = req.body;

      if (!username) {
        return res.status(400).json({
          error: 'username is required',
          example: { username: 'elonmusk', max_tweets: 20 }
        });
      }

      console.log(`🔍 Looking up @${username}...`);

      // Convert username to user_id
      const userId = await twitterService.getUserIdByUsername(username);

      console.log(`📥 Collecting ${max_tweets} tweets from @${username} (ID: ${userId})...`);

      // Fetch tweets from Twitter
      const tweets = await twitterService.fetchUserTweets(userId, max_tweets);

      if (tweets.length === 0) {
        return res.status(404).json({ error: 'No tweets found for user' });
      }

      // Generate embeddings
      console.log(`🔢 Generating embeddings for ${tweets.length} tweets...`);
      const embeddings = await embeddingService.generateTweetEmbeddings(tweets);

      // Use custom save_as name or username
      const storageUserId = save_as || username.replace('@', '');

      // Store in Qdrant
      console.log(`💾 Storing embeddings in Qdrant...`);
      const pointIds = await qdrantService.batchStoreTweetEmbeddings(
        storageUserId,
        tweets,
        embeddings
      );

      // Store in PostgreSQL
      console.log(`💾 Storing tweets in PostgreSQL...`);
      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        await query(
          `INSERT INTO user_tweets (user_id, tweet_id, text, created_at, engagement_score, qdrant_point_id, has_emoji, has_hashtag, length)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (tweet_id) DO UPDATE SET
             engagement_score = EXCLUDED.engagement_score,
             qdrant_point_id = EXCLUDED.qdrant_point_id`,
          [
            storageUserId,
            tweet.id,
            tweet.text,
            tweet.created_at,
            tweet.engagement_score,
            pointIds[i],
            tweet.has_emoji,
            tweet.has_hashtag,
            tweet.length
          ]
        );
      }

      // Update style profile
      await updateStyleProfile(storageUserId, tweets);

      res.json({
        success: true,
        message: 'Tweets collected successfully',
        username: username,
        twitter_user_id: userId,
        saved_as: storageUserId,
        count: tweets.length,
        next_step: `Use user_id "${storageUserId}" to generate drafts`
      });
    } catch (error: any) {
      console.error('Collection error:', error);
      res.status(500).json({
        error: 'Failed to collect tweets',
        details: error.message
      });
    }
  });

  /**
   * POST /tweets/collect
   * Collect user tweets and store embeddings
   */
  router.post('/collect', async (req: Request, res: Response) => {
    try {
      const { user_id, max_tweets = 100 } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      console.log(`📥 Collecting tweets for user ${user_id}...`);

      // 1. Fetch tweets from Twitter
      const tweets = await twitterService.fetchUserTweets(user_id, max_tweets);

      if (tweets.length === 0) {
        return res.status(404).json({ error: 'No tweets found for user' });
      }

      // 2. Generate embeddings
      console.log(`🔢 Generating embeddings for ${tweets.length} tweets...`);
      const embeddings = await embeddingService.generateTweetEmbeddings(tweets);

      // 3. Store in Qdrant
      console.log(`💾 Storing embeddings in Qdrant...`);
      const pointIds = await qdrantService.batchStoreTweetEmbeddings(
        user_id,
        tweets,
        embeddings
      );

      // 4. Store in PostgreSQL
      console.log(`💾 Storing tweets in PostgreSQL...`);
      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        await query(
          `INSERT INTO user_tweets (user_id, tweet_id, text, created_at, engagement_score, qdrant_point_id, has_emoji, has_hashtag, length)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (tweet_id) DO UPDATE SET
             engagement_score = EXCLUDED.engagement_score,
             qdrant_point_id = EXCLUDED.qdrant_point_id`,
          [
            user_id,
            tweet.id,
            tweet.text,
            tweet.created_at,
            tweet.engagement_score,
            pointIds[i],
            tweet.has_emoji,
            tweet.has_hashtag,
            tweet.length
          ]
        );
      }

      // 5. Update style profile
      await updateStyleProfile(user_id, tweets);

      res.json({
        message: 'Tweets collected successfully',
        count: tweets.length,
        user_id
      });
    } catch (error: any) {
      console.error('Collection error:', error);
      res.status(500).json({
        error: 'Failed to collect tweets',
        details: error.message
      });
    }
  });

  /**
   * GET /tweets/:user_id
   * Get stored tweets for a user
   */
  router.get('/:user_id', async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const tweets = await query(
        `SELECT * FROM user_tweets
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
      );

      res.json({
        user_id,
        count: tweets.length,
        tweets
      });
    } catch (error: any) {
      console.error('Fetch tweets error:', error);
      res.status(500).json({
        error: 'Failed to fetch tweets',
        details: error.message
      });
    }
  });

  /**
   * DELETE /tweets/:user_id
   * Delete all tweets for a user
   */
  router.delete('/:user_id', async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;

      // Delete from Qdrant
      await qdrantService.deleteUserTweets(user_id);

      // Delete from PostgreSQL
      await query('DELETE FROM user_tweets WHERE user_id = $1', [user_id]);
      await query('DELETE FROM user_style_profiles WHERE user_id = $1', [user_id]);

      res.json({
        message: 'Tweets deleted successfully',
        user_id
      });
    } catch (error: any) {
      console.error('Delete tweets error:', error);
      res.status(500).json({
        error: 'Failed to delete tweets',
        details: error.message
      });
    }
  });

  return router;
}

/**
 * Update user style profile based on collected tweets
 */
async function updateStyleProfile(userId: string, tweets: any[]) {
  const avgLength = Math.round(
    tweets.reduce((sum, t) => sum + t.length, 0) / tweets.length
  );

  const emojiCount = tweets.filter(t => t.has_emoji).length;
  const hashtagCount = tweets.filter(t => t.has_hashtag).length;

  const emojiFreq = emojiCount / tweets.length;
  const hashtagFreq = hashtagCount / tweets.length;

  await query(
    `INSERT INTO user_style_profiles (user_id, avg_length, emoji_frequency, hashtag_frequency, tone, sentence_structure)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       avg_length = EXCLUDED.avg_length,
       emoji_frequency = EXCLUDED.emoji_frequency,
       hashtag_frequency = EXCLUDED.hashtag_frequency,
       updated_at = NOW()`,
    [userId, avgLength, emojiFreq, hashtagFreq, 'casual', '1-2 sentences']
  );
}
