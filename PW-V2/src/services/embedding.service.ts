import OpenAI from 'openai';
import type { Tweet } from '../types/index.js';

export class EmbeddingService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Generate embedding for single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const cleanText = this.cleanText(text);

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: cleanText,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (texts.length > 2048) {
      throw new Error('Batch size cannot exceed 2048 texts');
    }

    try {
      const cleanTexts = texts.map(t => this.cleanText(t));

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: cleanTexts,
      });

      // Sort by index to ensure correct order
      const sortedData = response.data.sort((a, b) => a.index - b.index);
      return sortedData.map(item => item.embedding);
    } catch (error) {
      console.error('❌ Failed to generate batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for tweets with chunking for large batches
   */
  async generateTweetEmbeddings(
    tweets: Tweet[],
    chunkSize: number = 100
  ): Promise<number[][]> {
    if (tweets.length === 0) {
      return [];
    }

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < tweets.length; i += chunkSize) {
      const chunk = tweets.slice(i, i + chunkSize);
      const texts = chunk.map(t => t.text);

      console.log(`Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(tweets.length / chunkSize)}...`);

      const embeddings = await this.generateEmbeddings(texts);
      allEmbeddings.push(...embeddings);

      // Rate limit protection: small delay between chunks
      if (i + chunkSize < tweets.length) {
        await this.sleep(500);
      }
    }

    console.log(`✅ Generated ${allEmbeddings.length} embeddings`);
    return allEmbeddings;
  }

  /**
   * Clean text for embedding (remove newlines, trim whitespace)
   */
  private cleanText(text: string): string {
    return text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate cosine similarity between two vectors (utility)
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get embedding dimensions for current model
   */
  getDimensions(): number {
    const dimensions: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536
    };

    return dimensions[this.model] || 1536;
  }
}
