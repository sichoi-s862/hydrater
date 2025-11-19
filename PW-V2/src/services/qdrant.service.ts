import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';
import type { QdrantPoint, Tweet, SimilarTweet } from '../types/index.js';

export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;

  constructor(url: string, collectionName: string = 'user_tweets', apiKey?: string) {
    this.client = new QdrantClient({
      url,
      ...(apiKey && { apiKey })
    });
    this.collectionName = collectionName;
  }

  /**
   * Initialize Qdrant collection for tweet embeddings
   */
  async initializeCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // OpenAI text-embedding-3-small dimension
            distance: 'Cosine'
          }
        });
        console.log(`✅ Created Qdrant collection: ${this.collectionName}`);
      } else {
        console.log(`✓ Qdrant collection already exists: ${this.collectionName}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Qdrant collection:', error);
      throw error;
    }
  }

  /**
   * Store tweet embedding in Qdrant
   */
  async storeTweetEmbedding(
    userId: string,
    tweet: Tweet,
    embedding: number[]
  ): Promise<string> {
    const pointId = randomUUID();

    try {
      await this.client.upsert(this.collectionName, {
        points: [{
          id: pointId,
          vector: embedding,
          payload: {
            user_id: userId,
            tweet_id: tweet.id,
            text: tweet.text,
            created_at: tweet.created_at,
            engagement_score: tweet.engagement_score,
            has_emoji: tweet.has_emoji,
            has_hashtag: tweet.has_hashtag,
            length: tweet.length
          }
        }]
      });

      return pointId;
    } catch (error) {
      console.error(`❌ Failed to store tweet embedding for ${tweet.id}:`, error);
      throw error;
    }
  }

  /**
   * Batch store multiple tweet embeddings
   */
  async batchStoreTweetEmbeddings(
    userId: string,
    tweets: Tweet[],
    embeddings: number[][]
  ): Promise<string[]> {
    if (tweets.length !== embeddings.length) {
      throw new Error('Tweets and embeddings length mismatch');
    }

    const points = tweets.map((tweet, index) => ({
      id: randomUUID(),
      vector: embeddings[index],
      payload: {
        user_id: userId,
        tweet_id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        engagement_score: tweet.engagement_score,
        has_emoji: tweet.has_emoji,
        has_hashtag: tweet.has_hashtag,
        length: tweet.length
      }
    }));

    try {
      await this.client.upsert(this.collectionName, { points });
      console.log(`✅ Stored ${points.length} tweet embeddings for user ${userId}`);
      return points.map(p => p.id as string);
    } catch (error) {
      console.error('❌ Failed to batch store tweet embeddings:', error);
      throw error;
    }
  }

  /**
   * Search for similar tweets using vector similarity
   */
  async findSimilarTweets(
    userId: string,
    queryEmbedding: number[],
    topK: number = 5,
    minScore: number = 0.0
  ): Promise<SimilarTweet[]> {
    try {
      const searchResult = await this.client.query(this.collectionName, {
        query: queryEmbedding,
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId }
            }
          ]
        },
        limit: topK,
        with_payload: true
      });

      return searchResult.points
        .map(point => ({
          tweet: {
            id: point.payload?.tweet_id as string,
            text: point.payload?.text as string,
            created_at: point.payload?.created_at as string,
            engagement_score: point.payload?.engagement_score as number,
            has_emoji: point.payload?.has_emoji as boolean,
            has_hashtag: point.payload?.has_hashtag as boolean,
            length: point.payload?.length as number
          },
          similarity: point.score || 0
        }));
    } catch (error) {
      console.error('❌ Failed to search similar tweets:', error);
      throw error;
    }
  }

  /**
   * Delete all tweets for a user from Qdrant
   */
  async deleteUserTweets(userId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId }
            }
          ]
        }
      });
      console.log(`✅ Deleted all tweets for user ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to delete user tweets for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionInfo() {
    try {
      return await this.client.getCollection(this.collectionName);
    } catch (error) {
      console.error('❌ Failed to get collection info:', error);
      throw error;
    }
  }
}
