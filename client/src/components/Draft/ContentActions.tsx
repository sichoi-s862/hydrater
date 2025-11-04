import React, { useState } from 'react';
import type { StatusMessage } from '../../types';
import { contentAPI, draftAPI } from '../../services/api';
import '../../styles/ContentActions.css';

interface Props {
  onStatusChange: (status: StatusMessage) => void;
  onDraftsGenerated: () => void;
}

const ContentActions: React.FC<Props> = ({ onStatusChange, onDraftsGenerated }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleAnalyze = async () => {
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
  };

  const handleCrawl = async () => {
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
  };

  const handleGenerate = async () => {
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
  };

  return (
    <div className="card">
      <h3>Content Actions</h3>
      <div className="action-buttons">
        <button
          onClick={handleAnalyze}
          className="btn-primary"
          disabled={analyzing}
        >
          {analyzing ? 'Analyzing...' : 'Analyze My Posting Style'}
        </button>
        <button
          onClick={handleCrawl}
          className="btn-primary"
          disabled={crawling}
        >
          {crawling ? 'Crawling...' : 'Crawl Latest News'}
        </button>
        <button
          onClick={handleGenerate}
          className="btn-primary"
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Drafts'}
        </button>
      </div>
    </div>
  );
};

export default ContentActions;
