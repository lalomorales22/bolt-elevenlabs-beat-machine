import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Plus, Trash2, Save, Play, Square, Download, Volume2, VolumeX } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useSoundLibrary, Sound } from '../contexts/SoundLibraryContext';
import { useAudioContext } from '../contexts/AudioContext';
import { generateSoundEffect } from '../services/elevenlabsApi';

const SoundStudio: React.FC = () => {
  const { apiKey, setApiKey, isKeyConfigured } = useApiKey();
  const { sounds, saveSound, deleteSound, assignSoundToPad, loadSoundBuffer } = useSoundLibrary();
  const { playSound, stopAllSounds } = useAudioContext();
  
  const [apiKeyInput, setApiKeyInput] = useState<string>(apiKey || '');
  const [promptText, setPromptText] = useState<string>('');
  const [soundName, setSoundName] = useState<string>('');
  const [duration, setDuration] = useState<string>('1.5');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [assignToPadIndex, setAssignToPadIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4CAF50',
        progressColor: '#FF8C00',
        cursorColor: '#ffffff',
        barWidth: 2,
        barGap: 1,
        height: 80,
        normalize: true,
        responsive: true,
      });
    }
    
    return () => {
      wavesurferRef.current?.destroy();
    };
  }, []);
  
  useEffect(() => {
    const loadSoundIntoWaveform = async () => {
      if (selectedSound && wavesurferRef.current) {
        try {
          const arrayBuffer = await selectedSound.audioData.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          wavesurferRef.current.load(audioBuffer);
        } catch (err) {
          console.error('Error loading sound into waveform:', err);
        }
      }
    };
    
    loadSoundIntoWaveform();
  }, [selectedSound]);
  
  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      setError('Please enter a valid API key');
      return;
    }
    
    setApiKey(apiKeyInput);
    setSuccess('API key saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };
  
  const handleGenerateSound = async () => {
    if (!apiKey) {
      setError('Please set your ElevenLabs API key first');
      return;
    }
    
    if (!promptText.trim()) {
      setError('Please enter a description for the sound');
      return;
    }
    
    if (!soundName.trim()) {
      setError('Please enter a name for the sound');
      return;
    }
    
    const durationValue = parseFloat(duration);
    if (isNaN(durationValue) || durationValue < 0.5 || durationValue > 22) {
      setError('Duration must be between 0.5 and 22 seconds');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError('');
      
      const soundBlob = await generateSoundEffect(apiKey, promptText, durationValue);
      const sound = await saveSound(soundName, soundBlob, 'custom');
      
      setSuccess('Sound generated and saved successfully!');
      setSelectedSound(sound);
      setSoundName('');
      setPromptText('');
      
      const arrayBuffer = await soundBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      wavesurferRef.current?.load(audioBuffer);
      
    } catch (err) {
      console.error('Error generating sound:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while generating the sound.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePlaySound = async () => {
    if (selectedSound) {
      const buffer = await loadSoundBuffer(selectedSound);
      if (buffer) {
        playSound(buffer);
      }
    }
  };
  
  const handleStopSound = () => {
    stopAllSounds();
    wavesurferRef.current?.stop();
  };
  
  const handleDeleteSound = async () => {
    if (selectedSound) {
      if (window.confirm(`Are you sure you want to delete "${selectedSound.name}"?`)) {
        await deleteSound(selectedSound.id);
        setSelectedSound(null);
        wavesurferRef.current?.empty();
        setSuccess('Sound deleted successfully!');
      }
    }
  };
  
  const handleAssignToPad = () => {
    if (selectedSound && assignToPadIndex !== null) {
      assignSoundToPad(assignToPadIndex, selectedSound);
      setSuccess(`Sound assigned to Pad ${assignToPadIndex + 1}`);
      setAssignToPadIndex(null);
    }
  };
  
  const handleDownloadSound = () => {
    if (selectedSound) {
      const url = URL.createObjectURL(selectedSound.audioData);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedSound.name}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (wavesurferRef.current) {
      wavesurferRef.current.setMuted(!isMuted);
    }
  };
  
  const categories = ['all', ...new Set(sounds.map(sound => sound.category))];
  const filteredSounds = selectedCategory === 'all'
    ? sounds
    : sounds.filter(sound => sound.category === selectedCategory);
  
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="mpc-container p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-2xl font-bold text-white tracking-tight">
              BOLTxELEVENLABS_<span className="text-[#4CAF50]">beat-machine</span>
              <span className="text-sm ml-2 text-gray-400">v1.1</span>
            </div>
            <Link 
              to="/" 
              className="button-rect flex items-center gap-2"
            >
              <Home size={18} />
              Back to MPC
            </Link>
          </div>
          
          {/* API Key Configuration */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6 border border-[#3a3a3a]">
            <h2 className="text-xl font-semibold text-[#4CAF50] mb-4">ElevenLabs API Configuration</h2>
            
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-600 text-red-100 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500 bg-opacity-20 border border-green-600 text-green-100 px-4 py-2 rounded mb-4">
                {success}
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="flex-grow">
                <label className="block text-gray-300 mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your ElevenLabs API Key"
                  className="w-full px-3 py-2 bg-[#1a1a1a] text-white rounded-md border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveApiKey}
                  className="button-rect bg-[#4CAF50] hover:bg-[#45a049]"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sound Generation Section */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
              <h2 className="text-xl font-semibold text-[#4CAF50] mb-4">Generate New Sound</h2>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Sound Name</label>
                <input
                  type="text"
                  value={soundName}
                  onChange={(e) => setSoundName(e.target.value)}
                  placeholder="Enter a name for your sound"
                  className="w-full px-3 py-2 bg-[#1a1a1a] text-white rounded-md border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Sound Description</label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe the sound you want to generate..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[#1a1a1a] text-white rounded-md border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="0.5"
                  max="22"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1a1a1a] text-white rounded-md border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                />
              </div>
              
              <button
                onClick={handleGenerateSound}
                disabled={isGenerating || !isKeyConfigured}
                className={`button-rect w-full ${
                  isGenerating || !isKeyConfigured 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'bg-[#4CAF50] hover:bg-[#45a049]'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Sound'}
              </button>
            </div>
            
            {/* Sound Library Section */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
              <h2 className="text-xl font-semibold text-[#4CAF50] mb-4">Sound Library</h2>
              
              <div className="mb-4 flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`button-rect ${
                      selectedCategory === category
                        ? 'bg-[#4CAF50]'
                        : 'bg-[#3a3a3a]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <div className="bg-[#1a1a1a] rounded-md h-[300px] overflow-y-auto mb-4 border border-[#3a3a3a]">
                {filteredSounds.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No sounds in this category
                  </div>
                ) : (
                  <ul className="divide-y divide-[#3a3a3a]">
                    {filteredSounds.map(sound => (
                      <li
                        key={sound.id}
                        onClick={() => setSelectedSound(sound)}
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#2a2a2a] ${
                          selectedSound?.id === sound.id ? 'bg-[#2a2a2a]' : ''
                        }`}
                      >
                        <div>
                          <h3 className="text-white font-medium">{sound.name}</h3>
                          <p className="text-gray-400 text-xs">
                            {sound.category} • {sound.created.toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSound(sound);
                            handlePlaySound();
                          }}
                          className="button-rect p-2"
                        >
                          <Play size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {selectedSound && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <select
                      value={assignToPadIndex !== null ? assignToPadIndex : ''}
                      onChange={(e) => setAssignToPadIndex(Number(e.target.value))}
                      className="flex-grow px-3 py-2 bg-[#1a1a1a] text-white rounded-md border border-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                    >
                      <option value="">Select a pad...</option>
                      {Array.from({ length: 16 }).map((_, index) => (
                        <option key={index} value={index}>
                          Pad {index + 1}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignToPad}
                      disabled={assignToPadIndex === null}
                      className={`button-rect ${
                        assignToPadIndex === null 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'bg-[#4CAF50] hover:bg-[#45a049]'
                      }`}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sound Preview Section */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mt-6 border border-[#3a3a3a]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#4CAF50]">
                Sound Preview: {selectedSound ? selectedSound.name : 'No sound selected'}
              </h2>
              
              <div className="flex gap-2">
                <button
                  onClick={toggleMute}
                  className="button-rect p-2"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                
                <button
                  onClick={handlePlaySound}
                  disabled={!selectedSound}
                  className={`button-rect ${!selectedSound ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Play size={18} />
                </button>
                
                <button
                  onClick={handleStopSound}
                  disabled={!selectedSound}
                  className={`button-rect ${!selectedSound ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Square size={18} />
                </button>
                
                <button
                  onClick={handleDownloadSound}
                  disabled={!selectedSound}
                  className={`button-rect ${!selectedSound ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Download size={18} />
                </button>
                
                <button
                  onClick={handleDeleteSound}
                  disabled={!selectedSound}
                  className={`button-rect ${!selectedSound ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
              <div ref={waveformRef} className="w-full h-[120px]"></div>
            </div>
          </div>
          
          {/* Documentation Section */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mt-6 border border-[#3a3a3a]">
            <h2 className="text-xl font-semibold text-[#4CAF50] mb-4">How to Use the AI Beat Machine</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                <h3 className="text-[#4CAF50] font-semibold mb-2">Sound Generation</h3>
                <p className="text-gray-300 text-sm">
                  Create unique sounds using AI. Enter descriptive text and adjust duration to generate custom sounds for your beats.
                </p>
              </div>
              
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                <h3 className="text-[#4CAF50] font-semibold mb-2">Sound Library</h3>
                <p className="text-gray-300 text-sm">
                  Browse, organize, and manage your sounds. Create categories and assign sounds to pads for quick access.
                </p>
              </div>
              
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                <h3 className="text-[#4CAF50] font-semibold mb-2">Pad Assignment</h3>
                <p className="text-gray-300 text-sm">
                  Select a sound and assign it to any of the 16 pads on the MPC interface for performance.
                </p>
              </div>
              
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                <h3 className="text-[#4CAF50] font-semibold mb-2">Sound Preview</h3>
                <p className="text-gray-300 text-sm">
                  Preview sounds with waveform visualization. Download, delete, or modify sounds as needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundStudio;