import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { EmbeddingService } from '../services/embedding.service.js';
import { QdrantService } from '../services/qdrant.service.js';
import { query } from '../db/client.js';
import type { Tweet } from '../types/index.js';

export function createManualRouter(
  embeddingService: EmbeddingService,
  qdrantService: QdrantService
) {
  const router = Router();

  /**
   * POST /manual/add-tweets
   * Manually add tweets without Twitter API
   */
  router.post('/add-tweets', async (req: Request, res: Response) => {
    try {
      const { user_id, tweets } = req.body;

      // Validation
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
        return res.status(400).json({
          error: 'tweets array is required',
          example: {
            user_id: 'my_user_id',
            tweets: [
              'Your first tweet text here',
              'Your second tweet text here',
              'Your third tweet text here'
            ]
          }
        });
      }

      console.log(`📝 Manually adding ${tweets.length} tweets for user ${user_id}...`);

      // Convert string array to Tweet objects
      const tweetObjects: Tweet[] = tweets.map((text: string, index: number) => {
        const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/u.test(text);
        const hasHashtag = text.includes('#');

        return {
          id: randomUUID(),
          text: text,
          created_at: new Date().toISOString(),
          engagement_score: 0, // Default to 0 for manual tweets
          has_emoji: hasEmoji,
          has_hashtag: hasHashtag,
          length: text.length
        };
      });

      // Generate embeddings
      console.log(`🔢 Generating embeddings...`);
      const embeddings = await embeddingService.generateTweetEmbeddings(tweetObjects);

      // Store in Qdrant
      console.log(`💾 Storing embeddings in Qdrant...`);
      const pointIds = await qdrantService.batchStoreTweetEmbeddings(
        user_id,
        tweetObjects,
        embeddings
      );

      // Store in PostgreSQL
      console.log(`💾 Storing tweets in PostgreSQL...`);
      for (let i = 0; i < tweetObjects.length; i++) {
        const tweet = tweetObjects[i];
        await query(
          `INSERT INTO user_tweets (user_id, tweet_id, text, created_at, engagement_score, qdrant_point_id, has_emoji, has_hashtag, length)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (tweet_id) DO UPDATE SET
             text = EXCLUDED.text,
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

      // Update style profile
      await updateStyleProfile(user_id, tweetObjects);

      res.json({
        success: true,
        message: 'Tweets added successfully',
        count: tweetObjects.length,
        user_id,
        tweets: tweetObjects.map(t => ({
          id: t.id,
          text: t.text,
          length: t.length
        }))
      });
    } catch (error: any) {
      console.error('Manual add error:', error);
      res.status(500).json({
        error: 'Failed to add tweets',
        details: error.message
      });
    }
  });

  /**
   * POST /manual/quick-add
   * Quick add with just 5 tweets (simplified)
   */
  router.post('/quick-add', async (req: Request, res: Response) => {
    try {
      const { user_id, tweet1, tweet2, tweet3, tweet4, tweet5 } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const tweets = [tweet1, tweet2, tweet3, tweet4, tweet5].filter(Boolean);

      if (tweets.length === 0) {
        return res.status(400).json({
          error: 'At least one tweet is required',
          example: {
            user_id: 'my_user_id',
            tweet1: 'First tweet',
            tweet2: 'Second tweet',
            tweet3: 'Third tweet',
            tweet4: 'Fourth tweet',
            tweet5: 'Fifth tweet'
          }
        });
      }

      console.log(`⚡ Quick adding ${tweets.length} tweets for user ${user_id}...`);

      // Redirect to main add-tweets endpoint
      req.body = { user_id, tweets };
      return router.stack[0].handle(req, res);
    } catch (error: any) {
      console.error('Quick add error:', error);
      res.status(500).json({
        error: 'Failed to add tweets',
        details: error.message
      });
    }
  });

  return router;
}

/**
 * Update user style profile based on tweets
 */
async function updateStyleProfile(userId: string, tweets: Tweet[]) {
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
