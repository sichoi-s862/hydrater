import { TwitterApi } from 'twitter-api-v2';
import type { Tweet, TwitterCredentials } from '../types/index.js';

export class TwitterService {
  private client: TwitterApi;

  constructor(credentials: TwitterCredentials | string) {
    // Bearer Token (string) 또는 OAuth 1.0a (object)
    if (typeof credentials === 'string') {
      this.client = new TwitterApi(credentials); // Bearer Token
    } else {
      this.client = new TwitterApi({
        appKey: credentials.appKey,
        appSecret: credentials.appSecret,
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessSecret,
      });
    }
  }

  /**
   * Fetch user tweets using Twitter API V2
   */
  async fetchUserTweets(
    userId: string,
    maxResults: number = 100
  ): Promise<Tweet[]> {
    try {
      const timeline = await this.client.v2.userTimeline(userId, {
        'tweet.fields': ['created_at', 'public_metrics', 'entities'],
        'user.fields': ['username'],
        max_results: Math.min(maxResults, 100),
        exclude: ['retweets', 'replies'] // Only original tweets
      });

      const tweets: Tweet[] = [];

      for await (const tweet of timeline) {
        const hasEmoji = this.detectEmoji(tweet.text);
        const hasHashtag = tweet.entities?.hashtags && tweet.entities.hashtags.length > 0;
        const engagementScore = this.calculateEngagement(tweet.public_metrics);

        tweets.push({
          id: tweet.id,
          text: tweet.text,
          created_at: tweet.created_at || new Date().toISOString(),
          engagement_score: engagementScore,
          has_emoji: hasEmoji,
          has_hashtag: !!hasHashtag,
          length: tweet.text.length
        });

        if (tweets.length >= maxResults) break;
      }

      console.log(`✅ Fetched ${tweets.length} tweets for user ${userId}`);
      return tweets;
    } catch (error: any) {
      if (error.code === 429) {
        console.error('❌ Twitter API rate limit exceeded');
      } else if (error.code === 401) {
        console.error('❌ Twitter API authentication failed');
      } else {
        console.error('❌ Failed to fetch user tweets:', error.message);
      }
      throw error;
    }
  }

  /**
   * Fetch tweets in batches for large collections
   */
  async fetchUserTweetsInBatches(
    userId: string,
    totalTweets: number = 200,
    batchSize: number = 100
  ): Promise<Tweet[]> {
    const allTweets: Tweet[] = [];
    let remaining = totalTweets;

    while (remaining > 0) {
      const currentBatch = Math.min(remaining, batchSize);
      const tweets = await this.fetchUserTweets(userId, currentBatch);

      allTweets.push(...tweets);
      remaining -= tweets.length;

      // Stop if we got fewer tweets than requested (end of timeline)
      if (tweets.length < currentBatch) {
        break;
      }

      // Rate limit protection: wait 1 second between batches
      if (remaining > 0) {
        await this.sleep(1000);
      }
    }

    console.log(`✅ Total fetched: ${allTweets.length} tweets`);
    return allTweets;
  }

  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser() {
    try {
      const user = await this.client.v2.me();
      return user.data;
    } catch (error) {
      console.error('❌ Failed to get authenticated user:', error);
      throw error;
    }
  }

  /**
   * Get user ID from username
   */
  async getUserIdByUsername(username: string): Promise<string> {
    try {
      // Remove @ if present
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

      const user = await this.client.v2.userByUsername(cleanUsername);

      if (!user.data) {
        throw new Error(`User @${cleanUsername} not found`);
      }

      console.log(`✅ Found user @${cleanUsername} (ID: ${user.data.id})`);
      return user.data.id;
    } catch (error: any) {
      console.error(`❌ Failed to find user @${username}:`, error.message);
      throw error;
    }
  }

  /**
   * Calculate engagement score (likes + retweets * 2)
   */
  private calculateEngagement(metrics: any): number {
    if (!metrics) return 0;
    const likes = metrics.like_count || 0;
    const retweets = metrics.retweet_count || 0;
    return likes + (retweets * 2);
  }

  /**
   * Detect emoji in text
   */
  private detectEmoji(text: string): boolean {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(text);
  }

  /**
   * Sleep utility for rate limit handling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
