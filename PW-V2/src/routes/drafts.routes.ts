import { Router, Request, Response } from 'express';
import { DraftGeneratorService } from '../services/draftGenerator.service.js';
import { query } from '../db/client.js';

export function createDraftsRouter(draftGenerator: DraftGeneratorService) {
  const router = Router();

  /**
   * POST /drafts/generate
   * Generate personalized tweet drafts
   */
  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const {
        user_id,
        idea,
        num_variations = 3,
        top_k = 5
      } = req.body;

      if (!user_id || !idea) {
        return res.status(400).json({
          error: 'user_id and idea are required'
        });
      }

      console.log(`\n🎨 Generating drafts for user ${user_id}...`);
      console.log(`💡 Idea: "${idea}"`);

      const result = await draftGenerator.generateDrafts(
        user_id,
        idea,
        num_variations,
        top_k
      );

      // Store drafts in database
      for (const draft of result.drafts) {
        await query(
          `INSERT INTO drafts (user_id, idea_text, generated_text, similar_tweet_ids, confidence_score)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            user_id,
            idea,
            draft,
            result.similar_tweets.map(st => st.tweet.id),
            result.confidence
          ]
        );
      }

      res.json({
        success: true,
        user_id,
        idea,
        drafts: result.drafts,
        metadata: {
          similar_tweets_count: result.similar_tweets.length,
          similar_tweets: result.similar_tweets.map(st => ({
            text: st.tweet.text,
            similarity: st.similarity.toFixed(3),
            engagement: st.tweet.engagement_score
          })),
          style_profile: result.style_profile,
          confidence: result.confidence.toFixed(3)
        }
      });
    } catch (error: any) {
      console.error('Draft generation error:', error);
      res.status(500).json({
        error: 'Failed to generate drafts',
        details: error.message
      });
    }
  });

  /**
   * POST /drafts/regenerate
   * Regenerate with different variations
   */
  router.post('/regenerate', async (req: Request, res: Response) => {
    try {
      const { user_id, idea, previous_drafts = [] } = req.body;

      if (!user_id || !idea) {
        return res.status(400).json({
          error: 'user_id and idea are required'
        });
      }

      console.log(`\n🔄 Regenerating drafts for user ${user_id}...`);

      const newDrafts = await draftGenerator.regenerate(
        user_id,
        idea,
        previous_drafts
      );

      res.json({
        success: true,
        user_id,
        idea,
        drafts: newDrafts
      });
    } catch (error: any) {
      console.error('Regeneration error:', error);
      res.status(500).json({
        error: 'Failed to regenerate drafts',
        details: error.message
      });
    }
  });

  /**
   * GET /drafts/:user_id
   * Get draft history for user
   */
  router.get('/:user_id', async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const drafts = await query(
        `SELECT * FROM drafts
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
      );

      res.json({
        user_id,
        count: drafts.length,
        drafts
      });
    } catch (error: any) {
      console.error('Fetch drafts error:', error);
      res.status(500).json({
        error: 'Failed to fetch drafts',
        details: error.message
      });
    }
  });

  /**
   * GET /drafts/:user_id/profile
   * Get user style profile
   */
  router.get('/:user_id/profile', async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;

      const profiles = await query(
        'SELECT * FROM user_style_profiles WHERE user_id = $1',
        [user_id]
      );

      if (profiles.length === 0) {
        return res.status(404).json({
          error: 'Style profile not found. Collect tweets first.'
        });
      }

      res.json({
        user_id,
        profile: profiles[0]
      });
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      res.status(500).json({
        error: 'Failed to fetch style profile',
        details: error.message
      });
    }
  });

  return router;
}
