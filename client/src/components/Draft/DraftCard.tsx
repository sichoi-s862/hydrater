import React, { useState } from 'react';
import type { Draft, StatusMessage } from '../../types';
import { draftAPI } from '../../services/api';
import '../../styles/DraftCard.css';

interface Props {
  draft: Draft;
  onUpdate: () => void;
  onStatusChange: (status: StatusMessage) => void;
}

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
    <div className="draft-card">
      <div className="draft-header">
        <span className={`status-badge status-${draft.status}`}>
          {draft.status}
        </span>
        <span className="draft-date">
          {new Date(draft.createdAt).toLocaleString()}
        </span>
      </div>

      {isEditing ? (
        <textarea
          className="draft-content-edit"
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          rows={5}
          disabled={loading}
        />
      ) : (
        <p className="draft-content">{draft.content}</p>
      )}

      {draft.sourceUrl && (
        <p className="draft-source">
          Source: <a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer">
            {draft.sourceUrl}
          </a>
        </p>
      )}

      <div className="draft-actions">
        {isEditing ? (
          <>
            <button
              onClick={handleEdit}
              className="btn-primary btn-small"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="btn-secondary btn-small"
              disabled={loading}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEdit}
              className="btn-secondary btn-small"
              disabled={loading || draft.status === 'published'}
            >
              Edit
            </button>
            <button
              onClick={handleRegenerate}
              className="btn-secondary btn-small"
              disabled={loading || draft.status === 'published'}
            >
              Regenerate
            </button>
            <button
              onClick={handlePublish}
              className="btn-primary btn-small"
              disabled={loading || draft.status === 'published'}
            >
              {draft.status === 'published' ? 'Published' : 'Publish'}
            </button>
            <button
              onClick={handleDelete}
              className="btn-secondary btn-small"
              disabled={loading}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DraftCard;
