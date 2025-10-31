import pool from '../db/connection';
import { Draft } from '../types';

export class DraftModel {
  static async create(draftData: Omit<Draft, 'id' | 'created_at' | 'updated_at'>): Promise<Draft> {
    const query = `
      INSERT INTO drafts (user_id, content, source_urls, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      draftData.user_id,
      draftData.content,
      draftData.source_urls || [],
      draftData.status || 'generated'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId: string, status?: string): Promise<Draft[]> {
    let query = 'SELECT * FROM drafts WHERE user_id = $1';
    const values: any[] = [userId];

    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(draftId: string): Promise<Draft | null> {
    const query = 'SELECT * FROM drafts WHERE id = $1';
    const result = await pool.query(query, [draftId]);
    return result.rows[0] || null;
  }

  static async update(draftId: string, updates: Partial<Draft>): Promise<Draft> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.content !== undefined) {
      updateFields.push(`content = $${paramCount++}`);
      values.push(updates.content);
    }
    if (updates.edited_content !== undefined) {
      updateFields.push(`edited_content = $${paramCount++}`);
      values.push(updates.edited_content);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.tweet_id !== undefined) {
      updateFields.push(`tweet_id = $${paramCount++}`);
      values.push(updates.tweet_id);
    }
    if (updates.published_at !== undefined) {
      updateFields.push(`published_at = $${paramCount++}`);
      values.push(updates.published_at);
    }

    values.push(draftId);

    const query = `
      UPDATE drafts
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(draftId: string): Promise<void> {
    const query = 'DELETE FROM drafts WHERE id = $1';
    await pool.query(query, [draftId]);
  }
}
