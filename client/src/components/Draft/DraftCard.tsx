import React, { useState } from 'react';
import styled from '@emotion/styled';
import type { Draft, StatusMessage } from '../../types';
import { draftAPI } from '../../services/api';

interface Props {
  draft: Draft;
  onUpdate: () => void;
  onStatusChange: (status: StatusMessage) => void;
}

const Card = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transition.base};
  background: ${({ theme }) => theme.colors.background};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.25rem ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  text-transform: capitalize;
  background: ${({ theme, status }) => {
    const key = `status${status.charAt(0).toUpperCase() + status.slice(1)}` as 'statusGenerated' | 'statusEdited' | 'statusPublished';
    return (theme.colors[key] as any)?.bg || theme.colors.warningBg;
  }};
  color: ${({ theme, status }) => {
    const key = `status${status.charAt(0).toUpperCase() + status.slice(1)}` as 'statusGenerated' | 'statusEdited' | 'statusPublished';
    return (theme.colors[key] as any)?.text || theme.colors.warningText;
  }};
`;

const DateText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

const Content = styled.p`
  font-size: ${({ theme }) => theme.fontSize.lg};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${({ theme }) => theme.colors.text};
`;

const ContentEdit = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px solid ${({ theme }) => theme.colors.borderHover};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.base};
  font-family: inherit;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  resize: vertical;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const Source = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;

    button {
      flex: 1;
      min-width: calc(50% - ${({ theme }) => theme.spacing.xs} / 2);
    }
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.base};
  font-weight: ${({ theme }) => theme.fontWeight.medium};

  ${({ theme, variant = 'secondary' }) =>
    variant === 'primary'
      ? `
    background: ${theme.colors.primary};
    color: ${theme.colors.textOnPrimary};

    &:hover:not(:disabled) {
      background: ${theme.colors.primaryHover};
      transform: translateY(-2px);
      box-shadow: ${theme.boxShadow.primary};
    }
  `
      : `
    background: ${theme.colors.backgroundAlt};
    color: ${theme.colors.text};

    &:hover:not(:disabled) {
      background: ${theme.colors.border};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DraftCard: React.FC<Props> = ({ draft, onUpdate, onStatusChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(draft.content);
  const [loading, setLoading] = useState(false);

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditedContent(draft.content);
      return;
    }

    if (editedContent === draft.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await draftAPI.update(draft.id, editedContent);
      onStatusChange({
        type: 'success',
        message: 'Draft updated successfully!',
      });
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update draft',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate this draft?')) {
      return;
    }

    setLoading(true);
    try {
      await draftAPI.regenerate(draft.id);
      onStatusChange({
        type: 'success',
        message: 'Draft regenerated successfully!',
      });
      onUpdate();
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to regenerate draft',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this draft?')) {
      return;
    }

    setLoading(true);
    try {
      await draftAPI.publish(draft.id);
      onStatusChange({
        type: 'success',
        message: 'Draft published successfully!',
      });
      onUpdate();
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to publish draft',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    setLoading(true);
    try {
      await draftAPI.delete(draft.id);
      onStatusChange({
        type: 'success',
        message: 'Draft deleted successfully!',
      });
      onUpdate();
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete draft',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(draft.content);
  };

  return (
    <Card>
      <Header>
        <StatusBadge status={draft.status}>
          {draft.status}
        </StatusBadge>
        <DateText>
          {new Date(draft.createdAt).toLocaleString()}
        </DateText>
      </Header>

      {isEditing ? (
        <ContentEdit
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          rows={5}
          disabled={loading}
        />
      ) : (
        <Content>{draft.content}</Content>
      )}

      {draft.sourceUrl && (
        <Source>
          Source: <a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer">
            {draft.sourceUrl}
          </a>
        </Source>
      )}

      <Actions>
        {isEditing ? (
          <>
            <Button
              onClick={handleEdit}
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleEdit}
              disabled={loading || draft.status === 'published'}
            >
              Edit
            </Button>
            <Button
              onClick={handleRegenerate}
              disabled={loading || draft.status === 'published'}
            >
              Regenerate
            </Button>
            <Button
              onClick={handlePublish}
              variant="primary"
              disabled={loading || draft.status === 'published'}
            >
              {draft.status === 'published' ? 'Published' : 'Publish'}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </>
        )}
      </Actions>
    </Card>
  );
};

export default DraftCard;
