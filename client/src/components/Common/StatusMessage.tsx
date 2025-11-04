import React, { useEffect } from 'react';
import type { StatusMessage as StatusMessageType } from '../../types';
import '../../styles/StatusMessage.css';

interface Props {
  message: StatusMessageType | null;
  onClose: () => void;
  autoHideDuration?: number;
}

const StatusMessage: React.FC<Props> = ({
  message,
  onClose,
  autoHideDuration = 3000,
}) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [message, onClose, autoHideDuration]);

  if (!message) return null;

  return (
    <div className={`status-message status-${message.type}`}>
      {message.message}
    </div>
  );
};

export default StatusMessage;
