import React, { useState } from 'react';
import styled from '@emotion/styled';
import type { StatusMessage as StatusMessageType } from '../types';
import Navbar from '../components/Common/Navbar';
import StatusMessage from '../components/Common/StatusMessage';
import ProfileForm from '../components/Profile/ProfileForm';
import ContentActions from '../components/Draft/ContentActions';
import DraftList from '../components/Draft/DraftList';

const DashboardContainer = styled.div`
  min-height: 100vh;
`;

const DashboardContent = styled.div`
  max-width: 1200px;
  margin: ${({ theme }) => theme.spacing.xl} auto;
  padding: 0 ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.md};
    margin: ${({ theme }) => theme.spacing.md} auto;
  }
`;

const DashboardPage: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  const [draftsRefreshTrigger, setDraftsRefreshTrigger] = useState(0);

  const handleDraftsGenerated = () => {
    setDraftsRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DashboardContainer>
      <Navbar />

      <StatusMessage
        message={statusMessage}
        onClose={() => setStatusMessage(null)}
      />

      <DashboardContent>
        <ProfileForm onStatusChange={setStatusMessage} />
        <ContentActions
          onStatusChange={setStatusMessage}
          onDraftsGenerated={handleDraftsGenerated}
        />
        <DraftList
          onStatusChange={setStatusMessage}
          refreshTrigger={draftsRefreshTrigger}
        />
      </DashboardContent>
    </DashboardContainer>
  );
};

export default DashboardPage;
