import pool from '../db/connection';
import { User, UserProfile } from '../types';

export class UserModel {
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const query = `
      INSERT INTO users (twitter_id, username, display_name, profile_image_url,
                        access_token, access_token_secret, interests, brand_direction, author_style)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      userData.twitter_id,
      userData.username,
      userData.display_name,
      userData.profile_image_url,
      userData.access_token,
      userData.access_token_secret,
      userData.interests || [],
      userData.brand_direction,
      userData.author_style
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByTwitterId(twitterId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE twitter_id = $1';
    const result = await pool.query(query, [twitterId]);
    return result.rows[0] || null;
  }

  static async findById(userId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  static async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (profile.interests) {
      updates.push(`interests = $${paramCount++}`);
      values.push(profile.interests);
    }
    if (profile.brand_direction) {
      updates.push(`brand_direction = $${paramCount++}`);
      values.push(profile.brand_direction);
    }
    if (profile.author_style) {
      updates.push(`author_style = $${paramCount++}`);
      values.push(profile.author_style);
    }
    if (profile.target_audience) {
      updates.push(`target_audience = $${paramCount++}`);
      values.push(profile.target_audience);
    }
    if (profile.tone) {
      updates.push(`tone = $${paramCount++}`);
      values.push(profile.tone);
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateTokens(userId: string, accessToken: string, accessTokenSecret: string): Promise<void> {
    const query = `
      UPDATE users
      SET access_token = $1, access_token_secret = $2
      WHERE id = $3
    `;
    await pool.query(query, [accessToken, accessTokenSecret, userId]);
  }
}
