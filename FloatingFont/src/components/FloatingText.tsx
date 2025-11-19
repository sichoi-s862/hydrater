import styled from '@emotion/styled';
import FloatingLetter from './FloatingLetter';

interface FloatingTextProps {
  text: string;
  fontSize?: number;
  letterSpacing?: number;
  className?: string;
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 100%;
`;

const LetterWrapper = styled.div<{ spacing: number }>`
  display: flex;
  gap: ${props => props.spacing}px;
`;

const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  fontSize = 64,
  letterSpacing = 5,
  className = ''
}) => {
  return (
    <Container className={className}>
      <LetterWrapper spacing={letterSpacing}>
        {text.split('').map((letter, index) => (
          <FloatingLetter
            key={index}
            letter={letter}
            fontSize={fontSize}
          />
        ))}
      </LetterWrapper>
    </Container>
  );
};

export default FloatingText;
