import OpenAI from 'openai';
import type { SimilarTweet, UserStyleProfile, DraftResponse } from '../types/index.js';
import { QdrantService } from './qdrant.service.js';
import { EmbeddingService } from './embedding.service.js';
import { query } from '../db/client.js';

export class DraftGeneratorService {
  private openai: OpenAI;
  private qdrantService: QdrantService;
  private embeddingService: EmbeddingService;
  private model: string;

  constructor(
    openaiKey: string,
    qdrantService: QdrantService,
    embeddingService: EmbeddingService,
    model: string = 'gpt-4'
  ) {
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.qdrantService = qdrantService;
    this.embeddingService = embeddingService;
    this.model = model;
  }

  /**
   * Generate personalized tweet drafts based on idea and user style
   */
  async generateDrafts(
    userId: string,
    idea: string,
    numVariations: number = 3,
    topK: number = 5
  ): Promise<DraftResponse> {
    try {
      // 1. Generate embedding for the idea
      console.log(`📝 Generating embedding for idea...`);
      const ideaEmbedding = await this.embeddingService.generateEmbedding(idea);

      // 2. Find similar tweets from user's history
      console.log(`🔍 Searching for ${topK} similar tweets...`);
      const similarTweets = await this.qdrantService.findSimilarTweets(
        userId,
        ideaEmbedding,
        topK,
        0.3 // minimum similarity threshold
      );

      if (similarTweets.length === 0) {
        throw new Error(`No similar tweets found for user ${userId}. Please collect tweets first.`);
      }

      // 3. Get user style profile (if exists)
      console.log(`👤 Fetching user style profile...`);
      const styleProfile = await this.getUserStyleProfile(userId);

      // 4. Build prompt with examples
      const prompt = this.buildPrompt(idea, similarTweets, styleProfile);

      // 5. Generate variations using OpenAI
      console.log(`🤖 Generating ${numVariations} tweet variations...`);
      const drafts = await this.generateVariations(prompt, numVariations);

      // 6. Calculate confidence score
      const confidence = this.calculateConfidence(similarTweets);

      console.log(`✅ Generated ${drafts.length} drafts with confidence ${confidence.toFixed(2)}`);

      return {
        drafts,
        similar_tweets: similarTweets,
        style_profile: styleProfile,
        confidence
      };
    } catch (error) {
      console.error('❌ Failed to generate drafts:', error);
      throw error;
    }
  }

  /**
   * Build prompt with example tweets and style guidance
   */
  private buildPrompt(
    idea: string,
    similarTweets: SimilarTweet[],
    styleProfile: UserStyleProfile | null
  ): string {
    const examplesSection = similarTweets
      .map(st => st.tweet.text)
      .join('\n\n');

    const styleSection = styleProfile
      ? this.buildStyleDescription(styleProfile)
      : this.inferStyleFromExamples(similarTweets);

    return `You are an AI that writes tweets in the exact same style as the user.

Below are several example tweets written by this user.
These examples were chosen because their content is similar to the user's new idea.

<EXAMPLES_START>
${examplesSection}
<EXAMPLES_END>

Here is a summary of the user's writing style:
${styleSection}

Now, write **3 tweet variations** for the following idea, strictly matching the user's personal style:

"${idea}"

Rules:
- Do NOT sound like generic AI.
- Match the user's rhythm, sentence length, tone, vocabulary, and attitude.
- Follow the user's typical use of emojis, line breaks, and pacing.
- Do NOT add explanations. Just output the tweets.
- Return tweets separated by a blank line.
- Each tweet must be under 280 characters.`;
  }

  /**
   * Build style description from profile
   */
  private buildStyleDescription(profile: UserStyleProfile): string {
    const emojiUsage = profile.emoji_frequency > 0.3 ? 'frequently uses emojis' :
                      profile.emoji_frequency > 0.1 ? 'occasionally uses emojis' :
                      'rarely uses emojis';

    const hashtagUsage = profile.hashtag_frequency > 0.3 ? 'frequently uses hashtags' :
                        profile.hashtag_frequency > 0.1 ? 'occasionally uses hashtags' :
                        'rarely uses hashtags';

    return `- ${profile.tone} tone
- Average ${profile.avg_length} characters per tweet
- ${profile.sentence_structure} sentence structure
- ${emojiUsage}
- ${hashtagUsage}`;
  }

  /**
   * Infer style from example tweets
   */
  private inferStyleFromExamples(similarTweets: SimilarTweet[]): string {
    const avgLength = Math.round(
      similarTweets.reduce((sum, st) => sum + st.tweet.length, 0) / similarTweets.length
    );

    const emojiCount = similarTweets.filter(st => st.tweet.has_emoji).length;
    const hashtagCount = similarTweets.filter(st => st.tweet.has_hashtag).length;

    const emojiUsage = emojiCount > similarTweets.length * 0.5 ? 'frequently' :
                      emojiCount > 0 ? 'occasionally' : 'rarely';

    const hashtagUsage = hashtagCount > similarTweets.length * 0.5 ? 'frequently' :
                        hashtagCount > 0 ? 'occasionally' : 'rarely';

    return `- Casual and direct tone
- Average ${avgLength} characters per tweet
- 1-2 sentences per tweet
- ${emojiUsage} uses emojis
- ${hashtagUsage} uses hashtags`;
  }

  /**
   * Generate tweet variations using OpenAI
   */
  private async generateVariations(prompt: string, count: number): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional tweet writer who perfectly mimics user writing styles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const content = response.choices[0].message.content || '';

      // Split by double newlines to get individual tweets
      const tweets = content
        .split('\n\n')
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length <= 280);

      // If we got fewer tweets than requested, pad with variations
      if (tweets.length < count) {
        console.warn(`Only generated ${tweets.length} tweets, requested ${count}`);
      }

      return tweets.slice(0, count);
    } catch (error) {
      console.error('❌ OpenAI generation failed:', error);
      throw error;
    }
  }

  /**
   * Get user style profile from database
   */
  private async getUserStyleProfile(userId: string): Promise<UserStyleProfile | null> {
    try {
      const result = await query<UserStyleProfile>(
        'SELECT * FROM user_style_profiles WHERE user_id = $1',
        [userId]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Failed to fetch style profile:', error);
      return null;
    }
  }

  /**
   * Calculate confidence score based on similarity scores
   */
  private calculateConfidence(similarTweets: SimilarTweet[]): number {
    if (similarTweets.length === 0) return 0;

    const avgSimilarity = similarTweets.reduce((sum, st) => sum + st.similarity, 0) / similarTweets.length;

    // Confidence factors:
    // - Average similarity (0-1)
    // - Number of examples found (more is better)
    const countFactor = Math.min(similarTweets.length / 5, 1); // normalize to 5 examples

    return (avgSimilarity * 0.7 + countFactor * 0.3);
  }

  /**
   * Regenerate with different temperature for variety
   */
  async regenerate(
    userId: string,
    idea: string,
    previousDrafts: string[]
  ): Promise<string[]> {
    // Add negative examples to prompt
    const ideaEmbedding = await this.embeddingService.generateEmbedding(idea);
    const similarTweets = await this.qdrantService.findSimilarTweets(userId, ideaEmbedding, 5);
    const styleProfile = await this.getUserStyleProfile(userId);

    const basePrompt = this.buildPrompt(idea, similarTweets, styleProfile);
    const regeneratePrompt = `${basePrompt}

Note: Avoid these previous attempts:
${previousDrafts.join('\n')}

Generate 3 NEW variations that are different from above.`;

    return await this.generateVariations(regeneratePrompt, 3);
  }
}
