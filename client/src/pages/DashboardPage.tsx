import React, { useState } from 'react';
import type { StatusMessage as StatusMessageType } from '../types';
import Navbar from '../components/Common/Navbar';
import StatusMessage from '../components/Common/StatusMessage';
import ProfileForm from '../components/Profile/ProfileForm';
import ContentActions from '../components/Draft/ContentActions';
import DraftList from '../components/Draft/DraftList';
import '../styles/DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  const [draftsRefreshTrigger, setDraftsRefreshTrigger] = useState(0);

  const handleDraftsGenerated = () => {
    setDraftsRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="dashboard">
      <Navbar />

      <StatusMessage
        message={statusMessage}
        onClose={() => setStatusMessage(null)}
      />

      <div className="dashboard-content">
        <ProfileForm onStatusChange={setStatusMessage} />
        <ContentActions
          onStatusChange={setStatusMessage}
          onDraftsGenerated={handleDraftsGenerated}
        />
        <DraftList
          onStatusChange={setStatusMessage}
          refreshTrigger={draftsRefreshTrigger}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
