import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

interface FloatingLetterProps {
  letter: string;
  fontSize?: number;
}

const Letter = styled.span<{ fontSize: number }>`
  font-family: 'Cherry Bomb One', cursive;
  font-size: ${props => props.fontSize}px;
  color: #646cff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  cursor: default;
  user-select: none;
  will-change: transform;
  transition: color 0.3s ease;
  display: inline-block;

  &:hover {
    color: #535bf2;
    text-shadow: 2px 2px 8px rgba(100, 108, 255, 0.5);
  }
`;

const FloatingLetter: React.FC<FloatingLetterProps> = ({
  letter,
  fontSize = 64
}) => {
  const letterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!letterRef.current) return;

    let x = 0;
    let y = 0;
    let vx = (Math.random() - 0.5) * 0.1;
    let vy = (Math.random() - 0.5) * 0.1;

    // Very small drift range to prevent overlap
    const maxDriftX = fontSize * 0.05;
    const maxDriftY = fontSize * 0.03;

    const animate = () => {
      // Update position
      x += vx;
      y += vy;

      // Pull back to base position
      if (Math.abs(x) > maxDriftX) vx -= x * 0.01;
      if (Math.abs(y) > maxDriftY) vy -= y * 0.015;

      // Ensure minimum movement to prevent stalling
      const speed = Math.sqrt(vx * vx + vy * vy);
      const minSpeed = 0.01;
      const maxSpeed = 0.01;

      if (speed < minSpeed) {
        // Boost speed if too slow
        const boost = minSpeed / (speed + 0.001);
        vx *= boost;
        vy *= boost;
      } else if (speed > maxSpeed) {
        // Limit speed if too fast
        vx = (vx / speed) * maxSpeed;
        vy = (vy / speed) * maxSpeed;
      }

      // Apply position
      if (letterRef.current) {
        letterRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [fontSize]);

  return (
    <Letter ref={letterRef} fontSize={fontSize}>
      {letter}
    </Letter>
  );
};

export default FloatingLetter;
