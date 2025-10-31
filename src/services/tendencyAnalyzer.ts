import { TwitterApi } from 'twitter-api-v2';
import pool from '../db/connection';
import { TendencyAnalysis, User } from '../types';

export class TendencyAnalyzer {
  async analyzeUser(user: User): Promise<TendencyAnalysis> {
    try {
      // Initialize Twitter client with user tokens
      const client = new TwitterApi({
        appKey: process.env.TWITTER_CONSUMER_KEY!,
        appSecret: process.env.TWITTER_CONSUMER_SECRET!,
        accessToken: user.access_token,
        accessSecret: user.access_token_secret,
      });

      // Fetch user's recent tweets
      const tweets = await client.v2.userTimeline(user.twitter_id, {
        max_results: 100,
        'tweet.fields': ['created_at', 'public_metrics', 'entities']
      });

      // Analyze tweets
      const analysis = this.analyzeTweets(tweets.data.data || []);

      // Store analysis
      const storedAnalysis = await this.storeAnalysis(user.id, analysis);

      return storedAnalysis;
    } catch (error) {
      console.error('Error analyzing user tendency:', error);
      throw error;
    }
  }

  private analyzeTweets(tweets: any[]): Omit<TendencyAnalysis, 'id' | 'user_id' | 'analyzed_at'> {
    const commonTopics = this.extractTopics(tweets);
    const postingFrequency = this.calculatePostingFrequency(tweets);
    const engagementPatterns = this.analyzeEngagement(tweets);
    const styleMarkers = this.extractStyleMarkers(tweets);

    return {
      common_topics: commonTopics,
      posting_frequency: postingFrequency,
      engagement_patterns: engagementPatterns,
      style_markers: styleMarkers,
    };
  }

  private extractTopics(tweets: any[]): string[] {
    const hashtags = new Map<string, number>();
    const keywords = new Map<string, number>();

    for (const tweet of tweets) {
      // Extract hashtags
      tweet.entities?.hashtags?.forEach((tag: any) => {
        const hashtag = tag.tag.toLowerCase();
        hashtags.set(hashtag, (hashtags.get(hashtag) || 0) + 1);
      });

      // Extract keywords (simple approach - words > 4 chars)
      const words = tweet.text.toLowerCase().match(/\b\w{5,}\b/g) || [];
      words.forEach(word => {
        if (!this.isStopWord(word)) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });
    }

    // Get top topics
    const topHashtags = Array.from(hashtags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => `#${tag}`);

    const topKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return [...topHashtags, ...topKeywords];
  }

  private calculatePostingFrequency(tweets: any[]): string {
    if (tweets.length < 2) return 'insufficient_data';

    const dates = tweets
      .map(t => new Date(t.created_at))
      .sort((a, b) => b.getTime() - a.getTime());

    const oldestTweet = dates[dates.length - 1];
    const newestTweet = dates[0];
    const daysDiff = (newestTweet.getTime() - oldestTweet.getTime()) / (1000 * 60 * 60 * 24);

    const tweetsPerDay = tweets.length / daysDiff;

    if (tweetsPerDay > 5) return 'very_active';
    if (tweetsPerDay > 2) return 'active';
    if (tweetsPerDay > 0.5) return 'moderate';
    return 'occasional';
  }

  private analyzeEngagement(tweets: any[]): Record<string, any> {
    const metrics = {
      avgLikes: 0,
      avgRetweets: 0,
      avgReplies: 0,
      totalEngagement: 0
    };

    if (tweets.length === 0) return metrics;

    let totalLikes = 0;
    let totalRetweets = 0;
    let totalReplies = 0;

    for (const tweet of tweets) {
      totalLikes += tweet.public_metrics?.like_count || 0;
      totalRetweets += tweet.public_metrics?.retweet_count || 0;
      totalReplies += tweet.public_metrics?.reply_count || 0;
    }

    metrics.avgLikes = totalLikes / tweets.length;
    metrics.avgRetweets = totalRetweets / tweets.length;
    metrics.avgReplies = totalReplies / tweets.length;
    metrics.totalEngagement = totalLikes + totalRetweets + totalReplies;

    return metrics;
  }

  private extractStyleMarkers(tweets: any[]): string[] {
    const markers: string[] = [];
    let emojiCount = 0;
    let questionCount = 0;
    let exclamationCount = 0;
    let mentionCount = 0;

    for (const tweet of tweets) {
      const text = tweet.text;

      if (/[\u{1F600}-\u{1F64F}]/u.test(text)) emojiCount++;
      if (text.includes('?')) questionCount++;
      if (text.includes('!')) exclamationCount++;
      if (tweet.entities?.mentions?.length > 0) mentionCount++;
    }

    const total = tweets.length;
    if (emojiCount / total > 0.5) markers.push('emoji-heavy');
    if (questionCount / total > 0.3) markers.push('question-based');
    if (exclamationCount / total > 0.4) markers.push('enthusiastic');
    if (mentionCount / total > 0.3) markers.push('conversational');

    return markers;
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['about', 'after', 'before', 'being', 'could', 'would', 'should', 'there', 'their', 'these', 'those', 'where', 'which', 'while'];
    return stopWords.includes(word);
  }

  private async storeAnalysis(userId: string, analysis: any): Promise<TendencyAnalysis> {
    const query = `
      INSERT INTO tendency_analysis (user_id, common_topics, posting_frequency, engagement_patterns, style_markers)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      userId,
      analysis.common_topics,
      analysis.posting_frequency,
      analysis.engagement_patterns,
      analysis.style_markers
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getLatestAnalysis(userId: string): Promise<TendencyAnalysis | null> {
    const query = `
      SELECT * FROM tendency_analysis
      WHERE user_id = $1
      ORDER BY analyzed_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }
}
