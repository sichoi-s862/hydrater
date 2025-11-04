import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import type { StatusMessage as StatusMessageType } from '../../types';

interface Props {
  message: StatusMessageType | null;
  onClose: () => void;
  autoHideDuration?: number;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const StyledMessage = styled.div<{ type: 'success' | 'error' | 'info' | 'warning' }>`
  position: fixed;
  top: 80px;
  right: 20px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: ${({ theme }) => theme.boxShadow.lg};
  z-index: ${({ theme }) => theme.zIndex.toast};
  max-width: 400px;
  animation: ${slideIn} ${({ theme }) => theme.transition.base} ease-out;

  background: ${({ theme, type }) => theme.colors[`${type}Bg`]};
  color: ${({ theme, type }) => theme.colors[`${type}Text`]};
  border-left: 4px solid ${({ theme, type }) => theme.colors[type]};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    right: 10px;
    left: 10px;
    max-width: none;
    top: 70px;
  }
`;

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
    <StyledMessage type={message.type}>
      {message.message}
    </StyledMessage>
  );
};

export default StatusMessage;
