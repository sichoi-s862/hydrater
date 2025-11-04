import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import type { StatusMessage } from '../../types';
import { contentAPI, draftAPI } from '../../services/api';

interface Props {
  onStatusChange: (status: StatusMessage) => void;
  onDraftsGenerated: () => void;
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

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;

    button {
      width: 100%;
    }
  }
`;

const ActionButton = styled.button`
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

const ContentActions: React.FC<Props> = React.memo(({ onStatusChange, onDraftsGenerated }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    try {
      const response = await contentAPI.analyzeTendency();
      onStatusChange({
        type: 'success',
        message: response.message || 'Analysis complete!',
      });
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Analysis failed',
      });
    } finally {
      setAnalyzing(false);
    }
  }, [onStatusChange]);

  const handleCrawl = useCallback(async () => {
    setCrawling(true);
    try {
      const response = await contentAPI.crawlContent();
      onStatusChange({
        type: 'success',
        message: response.message || 'Crawling complete!',
      });
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Crawling failed',
      });
    } finally {
      setCrawling(false);
    }
  }, [onStatusChange]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await draftAPI.generate({ count: 3 });
      onStatusChange({
        type: 'success',
        message: `Generated ${response.drafts.length} drafts!`,
      });
      onDraftsGenerated();
    } catch (error) {
      onStatusChange({
        type: 'error',
        message: error instanceof Error ? error.message : 'Generation failed',
      });
    } finally {
      setGenerating(false);
    }
  }, [onStatusChange, onDraftsGenerated]);

  return (
    <Card>
      <h3>Content Actions</h3>
      <ActionButtons>
        <ActionButton
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? 'Analyzing...' : 'Analyze My Posting Style'}
        </ActionButton>
        <ActionButton
          onClick={handleCrawl}
          disabled={crawling}
        >
          {crawling ? 'Crawling...' : 'Crawl Latest News'}
        </ActionButton>
        <ActionButton
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Drafts'}
        </ActionButton>
      </ActionButtons>
    </Card>
  );
});

ContentActions.displayName = 'ContentActions';

export default ContentActions;
