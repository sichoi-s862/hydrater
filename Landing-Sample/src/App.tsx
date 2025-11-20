import Hero from './components/Hero';
import Features from './components/Features';

function App() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden font-sans">
      <Hero />
      <Features />

      {/* Simple Footer */}
      <footer className="py-8 text-center text-planet-text/40 text-sm bg-planet-bg/30">
        <p>© 2025 New Planet SaaS. All rights reserved across the galaxy.</p>
      </footer>
    </main>
  );
}

export default App;
