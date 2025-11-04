import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { UserProfile, StatusMessage } from '../../types';
import { userAPI } from '../../services/api';

interface Props {
  onStatusChange: (status: StatusMessage) => void;
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.boxShadow.md};

  h3 {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.base};
  transition: border-color ${({ theme }) => theme.transition.base};
  font-family: inherit;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.base};
  transition: border-color ${({ theme }) => theme.transition.base};
  font-family: inherit;
  min-height: 80px;
  resize: vertical;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.base};
  transition: border-color ${({ theme }) => theme.transition.base};
  font-family: inherit;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const SubmitButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.base};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.boxShadow.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

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
    <Card>
      <h3>Profile Setup</h3>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="interests">Interests (comma-separated)</Label>
          <Input
            type="text"
            id="interests"
            name="interests"
            value={profile.interests || ''}
            onChange={handleChange}
            placeholder="e.g., technology, AI, startups"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="brandDirection">Brand Direction</Label>
          <TextArea
            id="brandDirection"
            name="brandDirection"
            value={profile.brandDirection || ''}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your brand's direction and values"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="authorStyle">Author Style</Label>
          <TextArea
            id="authorStyle"
            name="authorStyle"
            value={profile.authorStyle || ''}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your writing style"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            type="text"
            id="targetAudience"
            name="targetAudience"
            value={profile.targetAudience || ''}
            onChange={handleChange}
            placeholder="e.g., developers, entrepreneurs"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="tone">Tone</Label>
          <Select
            id="tone"
            name="tone"
            value={profile.tone || 'professional'}
            onChange={handleChange}
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="humorous">Humorous</option>
            <option value="inspirational">Inspirational</option>
          </Select>
        </FormGroup>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </SubmitButton>
      </Form>
    </Card>
  );
};

export default ProfileForm;
