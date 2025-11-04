import React, { useState, useEffect } from 'react';
import type { Draft, DraftStatus, StatusMessage } from '../../types';
import { draftAPI } from '../../services/api';
import DraftCard from './DraftCard';
import '../../styles/DraftList.css';

interface Props {
  onStatusChange: (status: StatusMessage) => void;
  refreshTrigger: number;
}

type FilterType = 'all' | DraftStatus;

const DraftList: React.FC<Props> = ({ onStatusChange, refreshTrigger }) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, [filter, refreshTrigger]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await draftAPI.getAll(status);
      setDrafts(data);
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load drafts',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Drafts</h3>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'generated' ? 'active' : ''}`}
          onClick={() => setFilter('generated')}
        >
          Generated
        </button>
        <button
          className={`filter-tab ${filter === 'edited' ? 'active' : ''}`}
          onClick={() => setFilter('edited')}
        >
          Edited
        </button>
        <button
          className={`filter-tab ${filter === 'published' ? 'active' : ''}`}
          onClick={() => setFilter('published')}
        >
          Published
        </button>
      </div>

      <div className="drafts-container">
        {loading ? (
          <p className="no-drafts">Loading drafts...</p>
        ) : drafts.length === 0 ? (
          <p className="no-drafts">
            No drafts yet. Generate some drafts to get started!
          </p>
        ) : (
          drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onUpdate={loadDrafts}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DraftList;
