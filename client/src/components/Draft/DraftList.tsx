import React, { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import type { Draft, DraftStatus, StatusMessage } from '../../types';
import { draftAPI } from '../../services/api';
import DraftCard from './DraftCard';

interface Props {
  onStatusChange: (status: StatusMessage) => void;
  refreshTrigger: number;
}

type FilterType = 'all' | DraftStatus;

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

const FilterTabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const FilterTab = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: none;
  border: none;
  border-bottom: 3px solid ${({ active, theme }) =>
    active ? theme.colors.borderHover : 'transparent'};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.base};
  transition: all ${({ theme }) => theme.transition.base};
  color: ${({ active, theme }) =>
    active ? theme.colors.primary : theme.colors.textMuted};
  font-weight: ${({ active, theme }) =>
    active ? theme.fontWeight.medium : theme.fontWeight.normal};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.backgroundAlt};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.fontSize.sm};
    white-space: nowrap;
  }
`;

const DraftsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const NoDrafts = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};
  padding: ${({ theme }) => theme.spacing['3xl']};
  font-size: ${({ theme }) => theme.fontSize.lg};
`;

const DraftList: React.FC<Props> = React.memo(({ onStatusChange, refreshTrigger }) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);

  const loadDrafts = useCallback(async () => {
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
  }, [filter, onStatusChange]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts, refreshTrigger]);

  return (
    <Card>
      <h3>Drafts</h3>

      <FilterTabs role="tablist" aria-label="Draft status filter">
        <FilterTab
          role="tab"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          aria-selected={filter === 'all'}
          aria-label="Show all drafts"
        >
          All
        </FilterTab>
        <FilterTab
          role="tab"
          active={filter === 'generated'}
          onClick={() => setFilter('generated')}
          aria-selected={filter === 'generated'}
          aria-label="Show generated drafts only"
        >
          Generated
        </FilterTab>
        <FilterTab
          role="tab"
          active={filter === 'edited'}
          onClick={() => setFilter('edited')}
          aria-selected={filter === 'edited'}
          aria-label="Show edited drafts only"
        >
          Edited
        </FilterTab>
        <FilterTab
          role="tab"
          active={filter === 'published'}
          onClick={() => setFilter('published')}
          aria-selected={filter === 'published'}
          aria-label="Show published drafts only"
        >
          Published
        </FilterTab>
      </FilterTabs>

      <DraftsContainer>
        {loading ? (
          <NoDrafts>Loading drafts...</NoDrafts>
        ) : drafts.length === 0 ? (
          <NoDrafts>
            No drafts yet. Generate some drafts to get started!
          </NoDrafts>
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
      </DraftsContainer>
    </Card>
  );
});

DraftList.displayName = 'DraftList';

export default DraftList;
