import OpenAI from 'openai';
import { User, TendencyAnalysis, CrawledContent } from '../types';
import { DraftModel } from '../models/Draft';
import { TendencyAnalyzer } from './tendencyAnalyzer';
import { ContentCrawler } from './crawler';

export class DraftGenerator {
  private openai: OpenAI;
  private tendencyAnalyzer: TendencyAnalyzer;
  private crawler: ContentCrawler;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.tendencyAnalyzer = new TendencyAnalyzer();
    this.crawler = new ContentCrawler();
  }

  async generateDrafts(user: User, count: number = 3): Promise<any[]> {
    try {
      // Get user's tendency analysis
      let tendencyAnalysis = await this.tendencyAnalyzer.getLatestAnalysis(user.id);

      // If no analysis exists, perform one
      if (!tendencyAnalysis) {
        console.log('No tendency analysis found, performing analysis...');
        tendencyAnalysis = await this.tendencyAnalyzer.analyzeUser(user);
      }

      // Get recent crawled content
      const recentContent = await this.crawler.getRecentContentForUser(user.id, 5);

      // Generate drafts using OpenAI
      const prompt = this.buildPrompt(user, tendencyAnalysis, recentContent);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a social media content creator specialized in crafting engaging Twitter/X posts. Generate posts that match the user\'s style and interests.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
        n: count
      });

      // Store drafts in database
      const drafts = [];
      const sourceUrls = recentContent.map(c => c.url);

      for (const choice of completion.choices) {
        const content = choice.message.content?.trim();
        if (content) {
          const draft = await DraftModel.create({
            user_id: user.id,
            content,
            source_urls: sourceUrls,
            status: 'generated'
          });
          drafts.push(draft);
        }
      }

      return drafts;
    } catch (error) {
      console.error('Error generating drafts:', error);
      throw error;
    }
  }

  private buildPrompt(user: User, analysis: TendencyAnalysis, content: CrawledContent[]): string {
    let prompt = `Generate ${3} unique Twitter/X post drafts based on the following information:\n\n`;

    // User preferences
    prompt += `USER PROFILE:\n`;
    if (user.interests && user.interests.length > 0) {
      prompt += `- Interests: ${user.interests.join(', ')}\n`;
    }
    if (user.brand_direction) {
      prompt += `- Brand Direction: ${user.brand_direction}\n`;
    }
    if (user.author_style) {
      prompt += `- Writing Style: ${user.author_style}\n`;
    }
    if (user.target_audience) {
      prompt += `- Target Audience: ${user.target_audience}\n`;
    }
    if (user.tone) {
      prompt += `- Tone: ${user.tone}\n`;
    }

    // Tendency analysis
    prompt += `\nPOSTING PATTERNS:\n`;
    if (analysis.common_topics && analysis.common_topics.length > 0) {
      prompt += `- Common Topics: ${analysis.common_topics.join(', ')}\n`;
    }
    prompt += `- Posting Frequency: ${analysis.posting_frequency}\n`;
    if (analysis.style_markers && analysis.style_markers.length > 0) {
      prompt += `- Style Markers: ${analysis.style_markers.join(', ')}\n`;
    }

    // Recent content
    if (content.length > 0) {
      prompt += `\nRELEVANT NEWS/CONTENT TO REFERENCE:\n`;
      content.slice(0, 3).forEach((item, index) => {
        prompt += `${index + 1}. ${item.title}\n`;
        if (item.summary) {
          prompt += `   Summary: ${item.summary.substring(0, 150)}...\n`;
        }
        prompt += `   URL: ${item.url}\n`;
      });
    }

    prompt += `\nREQUIREMENTS:
- Each post must be under 280 characters
- Match the user's writing style and tone
- Be engaging and authentic
- Include relevant hashtags if appropriate
- Reference the news/content naturally if relevant
- Make each draft unique and different from the others

Generate the posts now (one per line, no numbering):`;

    return prompt;
  }

  async regenerateDraft(draftId: string, user: User): Promise<any> {
    try {
      const existingDraft = await DraftModel.findById(draftId);
      if (!existingDraft || existingDraft.user_id !== user.id) {
        throw new Error('Draft not found or unauthorized');
      }

      // Get user's tendency analysis
      const tendencyAnalysis = await this.tendencyAnalyzer.getLatestAnalysis(user.id);
      if (!tendencyAnalysis) {
        throw new Error('Tendency analysis required');
      }

      // Get recent content
      const recentContent = await this.crawler.getRecentContentForUser(user.id, 5);

      // Generate new version
      const prompt = this.buildPrompt(user, tendencyAnalysis, recentContent);
      prompt += `\n\nPrevious version (to avoid repetition): ${existingDraft.content}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a social media content creator. Generate a fresh alternative to the provided post.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 500
      });

      const newContent = completion.choices[0].message.content?.trim();
      if (!newContent) {
        throw new Error('Failed to generate new content');
      }

      // Update draft
      const updatedDraft = await DraftModel.update(draftId, {
        content: newContent,
        status: 'generated'
      });

      return updatedDraft;
    } catch (error) {
      console.error('Error regenerating draft:', error);
      throw error;
    }
  }
}
