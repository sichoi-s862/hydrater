import React from 'react';
import styled from '@emotion/styled';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  color: ${({ theme }) => theme.colors.textOnPrimary};
  background: ${({ theme }) => theme.colors.backgroundGradient};
`;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSize['5xl']};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSize['3xl']};
  }
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  opacity: 0.9;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSize.xl};
  }
`;

const LoginButton = styled.button`
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

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <PageContainer>
      <LoginContainer>
        <Title>Hydrater</Title>
        <Subtitle>
          X (Twitter) content automation platform
        </Subtitle>
        <LoginButton onClick={login}>
          Login with X
        </LoginButton>
      </LoginContainer>
    </PageContainer>
  );
};

export default LoginPage;
