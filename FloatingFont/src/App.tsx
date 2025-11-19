import styled from '@emotion/styled'
import FloatingText from './components/FloatingText'

const AppContainer = styled.div`
  width: 100vw;
  height: 100vw;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  overflow: hidden;
`;

function App() {
  return (
    <AppContainer>
      <FloatingText text="TestText" fontSize={128} letterSpacing={3} />
    </AppContainer>
  )
}

export default App
