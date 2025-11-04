import React, { useState, useEffect } from 'react';
import type { UserProfile, StatusMessage } from '../../types';
import { userAPI } from '../../services/api';
import '../../styles/ProfileForm.css';

interface Props {
  onStatusChange: (status: StatusMessage) => void;
}

const ProfileForm: React.FC<Props> = ({ onStatusChange }) => {
  const [profile, setProfile] = useState<UserProfile>({
    interests: '',
    brandDirection: '',
    authorStyle: '',
    targetAudience: '',
    tone: 'professional',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userAPI.updateProfile(profile);
      onStatusChange({
        type: 'success',
        message: 'Profile updated successfully!',
      });
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <h3>Profile Setup</h3>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="interests">Interests (comma-separated)</label>
          <input
            type="text"
            id="interests"
            name="interests"
            value={profile.interests || ''}
            onChange={handleChange}
            placeholder="e.g., technology, AI, startups"
          />
        </div>

        <div className="form-group">
          <label htmlFor="brandDirection">Brand Direction</label>
          <textarea
            id="brandDirection"
            name="brandDirection"
            value={profile.brandDirection || ''}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your brand's direction and values"
          />
        </div>

        <div className="form-group">
          <label htmlFor="authorStyle">Author Style</label>
          <textarea
            id="authorStyle"
            name="authorStyle"
            value={profile.authorStyle || ''}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your writing style"
          />
        </div>

        <div className="form-group">
          <label htmlFor="targetAudience">Target Audience</label>
          <input
            type="text"
            id="targetAudience"
            name="targetAudience"
            value={profile.targetAudience || ''}
            onChange={handleChange}
            placeholder="e.g., developers, entrepreneurs"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tone">Tone</label>
          <select
            id="tone"
            name="tone"
            value={profile.tone || 'professional'}
            onChange={handleChange}
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="humorous">Humorous</option>
            <option value="inspirational">Inspirational</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
