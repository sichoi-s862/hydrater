import axios from 'axios';
import * as cheerio from 'cheerio';
import pool from '../db/connection';
import { CrawledContent } from '../types';

interface NewsSource {
  name: string;
  url: string;
  type: 'rss' | 'webpage';
}

export class ContentCrawler {
  private newsSources: NewsSource[] = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com/', type: 'webpage' },
  ];

  async crawlForUser(userId: string, interests: string[]): Promise<CrawledContent[]> {
    const allContent: CrawledContent[] = [];

    for (const source of this.newsSources) {
      try {
        let content: any[];

        if (source.type === 'rss') {
          content = await this.crawlRSS(source.url);
        } else {
          content = await this.crawlWebpage(source.url);
        }

        // Filter and score content based on interests
        const relevantContent = content
          .map(item => ({
            ...item,
            source: source.name,
            relevance_score: this.calculateRelevance(item, interests)
          }))
          .filter(item => item.relevance_score > 0.3);

        // Store in database
        for (const item of relevantContent) {
          const stored = await this.storeContent(item);
          if (stored) {
            await this.linkContentToUser(userId, stored.id, item.relevance_score);
            allContent.push(stored);
          }
        }
      } catch (error) {
        console.error(`Error crawling ${source.name}:`, error);
      }
    }

    return allContent.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  private async crawlRSS(url: string): Promise<any[]> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Hydrater/1.0' }
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const items: any[] = [];

      $('item').each((_, element) => {
        const $item = $(element);
        items.push({
          title: $item.find('title').text(),
          url: $item.find('link').text(),
          summary: $item.find('description').text().replace(/<[^>]*>/g, '').substring(0, 500),
          published_date: new Date($item.find('pubDate').text() || Date.now())
        });
      });

      return items;
    } catch (error) {
      console.error('RSS crawl error:', error);
      return [];
    }
  }

  private async crawlWebpage(url: string): Promise<any[]> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Hydrater/1.0' }
      });

      const $ = cheerio.load(response.data);
      const items: any[] = [];

      // Hacker News specific parsing
      $('.athing').each((index, element) => {
        if (index >= 20) return; // Limit to top 20

        const $element = $(element);
        const $titleLine = $element.find('.titleline');
        const link = $titleLine.find('a').first();

        items.push({
          title: link.text(),
          url: link.attr('href') || '',
          summary: link.text().substring(0, 200),
          published_date: new Date()
        });
      });

      return items;
    } catch (error) {
      console.error('Webpage crawl error:', error);
      return [];
    }
  }

  private calculateRelevance(item: any, interests: string[]): number {
    if (interests.length === 0) return 0.5;

    const text = `${item.title} ${item.summary}`.toLowerCase();
    let matchCount = 0;

    for (const interest of interests) {
      if (text.includes(interest.toLowerCase())) {
        matchCount++;
      }
    }

    return Math.min(matchCount / interests.length, 1.0);
  }

  private async storeContent(content: any): Promise<CrawledContent | null> {
    try {
      const query = `
        INSERT INTO crawled_content (title, url, summary, source, published_date, relevance_score)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (url) DO UPDATE
        SET relevance_score = EXCLUDED.relevance_score
        RETURNING *
      `;

      const values = [
        content.title,
        content.url,
        content.summary,
        content.source,
        content.published_date,
        content.relevance_score
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error storing content:', error);
      return null;
    }
  }

  private async linkContentToUser(userId: string, contentId: string, relevanceScore: number): Promise<void> {
    try {
      const query = `
        INSERT INTO user_crawled_content (user_id, content_id, relevance_score)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, content_id) DO UPDATE
        SET relevance_score = EXCLUDED.relevance_score
      `;

      await pool.query(query, [userId, contentId, relevanceScore]);
    } catch (error) {
      console.error('Error linking content to user:', error);
    }
  }

  async getRecentContentForUser(userId: string, limit: number = 10): Promise<CrawledContent[]> {
    const query = `
      SELECT c.*, ucc.relevance_score as user_relevance_score
      FROM crawled_content c
      INNER JOIN user_crawled_content ucc ON c.id = ucc.content_id
      WHERE ucc.user_id = $1
      ORDER BY c.created_at DESC, ucc.relevance_score DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }
}
