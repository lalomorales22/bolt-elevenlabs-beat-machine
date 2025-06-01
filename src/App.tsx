import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MpcInterface from './components/MpcInterface';
import SoundStudio from './components/SoundStudio';
import { AudioProvider } from './contexts/AudioContext';
import { SoundLibraryProvider } from './contexts/SoundLibraryContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';

function App() {
  return (
    <Router>
      <ApiKeyProvider>
        <SoundLibraryProvider>
          <AudioProvider>
            <Routes>
              <Route path="/" element={<MpcInterface />} />
              <Route path="/studio" element={<SoundStudio />} />
            </Routes>
          </AudioProvider>
        </SoundLibraryProvider>
      </ApiKeyProvider>
    </Router>
  );
}

export default App;