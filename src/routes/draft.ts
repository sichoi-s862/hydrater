import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { DraftModel } from '../models/Draft';
import { DraftGenerator } from '../services/draftGenerator';
import { ContentCrawler } from '../services/crawler';
import { TendencyAnalyzer } from '../services/tendencyAnalyzer';
import { TwitterApi } from 'twitter-api-v2';
import { UserModel } from '../models/User';

const router = Router();
const draftGenerator = new DraftGenerator();
const crawler = new ContentCrawler();
const tendencyAnalyzer = new TendencyAnalyzer();

// Generate new drafts
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { count = 3 } = req.body;

    // First, crawl content for the user
    console.log('Crawling content for user...');
    await crawler.crawlForUser(user.id, user.interests || []);

    // Generate drafts
    console.log('Generating drafts...');
    const drafts = await draftGenerator.generateDrafts(user, count);

    res.json({
      success: true,
      drafts: drafts.map(d => ({
        id: d.id,
        content: d.content,
        sourceUrls: d.source_urls,
        status: d.status,
        createdAt: d.created_at
      }))
    });
  } catch (error) {
    console.error('Error generating drafts:', error);
    res.status(500).json({ error: 'Failed to generate drafts' });
  }
});

// Get all drafts for user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { status } = req.query;

    const drafts = await DraftModel.findByUserId(user.id, status as string);

    res.json({
      drafts: drafts.map(d => ({
        id: d.id,
        content: d.content,
        editedContent: d.edited_content,
        sourceUrls: d.source_urls,
        status: d.status,
        publishedAt: d.published_at,
        tweetId: d.tweet_id,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Get single draft
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    const draft = await DraftModel.findById(id);

    if (!draft || draft.user_id !== user.id) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

// Update draft (edit content)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const { editedContent } = req.body;

    const draft = await DraftModel.findById(id);

    if (!draft || draft.user_id !== user.id) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const updated = await DraftModel.update(id, {
      edited_content: editedContent,
      status: 'edited'
    });

    res.json({ success: true, draft: updated });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

// Regenerate draft
router.post('/:id/regenerate', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    const updated = await draftGenerator.regenerateDraft(id, user);

    res.json({ success: true, draft: updated });
  } catch (error) {
    console.error('Error regenerating draft:', error);
    res.status(500).json({ error: 'Failed to regenerate draft' });
  }
});

// Publish draft to Twitter/X
router.post('/:id/publish', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    const draft = await DraftModel.findById(id);

    if (!draft || draft.user_id !== user.id) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Get user's full data for tokens
    const fullUser = await UserModel.findById(user.id);
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY!,
      appSecret: process.env.TWITTER_CONSUMER_SECRET!,
      accessToken: fullUser.access_token,
      accessSecret: fullUser.access_token_secret,
    });

    // Post to Twitter
    const contentToPost = draft.edited_content || draft.content;
    const tweet = await client.v2.tweet(contentToPost);

    // Update draft status
    const updated = await DraftModel.update(id, {
      status: 'published',
      published_at: new Date(),
      tweet_id: tweet.data.id
    });

    res.json({
      success: true,
      draft: updated,
      tweetUrl: `https://twitter.com/${user.username}/status/${tweet.data.id}`
    });
  } catch (error) {
    console.error('Error publishing draft:', error);
    res.status(500).json({ error: 'Failed to publish draft' });
  }
});

// Delete draft
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    const draft = await DraftModel.findById(id);

    if (!draft || draft.user_id !== user.id) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    await DraftModel.delete(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// Trigger content crawling
router.post('/crawl', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;

    const content = await crawler.crawlForUser(user.id, user.interests || []);

    res.json({
      success: true,
      contentCount: content.length,
      topContent: content.slice(0, 5)
    });
  } catch (error) {
    console.error('Error crawling content:', error);
    res.status(500).json({ error: 'Failed to crawl content' });
  }
});

// Trigger tendency analysis
router.post('/analyze', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const fullUser = await UserModel.findById(user.id);

    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const analysis = await tendencyAnalyzer.analyzeUser(fullUser);

    res.json({
      success: true,
      analysis: {
        commonTopics: analysis.common_topics,
        postingFrequency: analysis.posting_frequency,
        engagementPatterns: analysis.engagement_patterns,
        styleMarkers: analysis.style_markers,
        analyzedAt: analysis.analyzed_at
      }
    });
  } catch (error) {
    console.error('Error analyzing tendency:', error);
    res.status(500).json({ error: 'Failed to analyze tendency' });
  }
});

export default router;
