import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { useAudioContext } from '../contexts/AudioContext';
import { useSoundLibrary } from '../contexts/SoundLibraryContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import Pad from './Pad';
import Slider from './Knob';
import AIGenerateModal from './AIGenerateModal';

const MpcInterface: React.FC = () => {
  const { 
    masterVolume, 
    setMasterVolume,
    applyToneFilter,
    applyPitch,
    applyFilter,
    applyReverb,
    playSound,
    stopAllSounds,
    isRecording,
    startRecording,
    stopRecording,
    isPlaying,
    togglePlayback,
    isOverdubbing,
    startOverdub,
    stopOverdub,
    playFromStart
  } = useAudioContext();
  
  const { isKeyConfigured } = useApiKey();
  const { sounds, padSounds, deleteSound, loadSoundBuffer } = useSoundLibrary();
  
  const [toneValue, setToneValue] = useState(0.5);
  const [pitchValue, setPitchValue] = useState(0.5);
  const [filterValue, setFilterValue] = useState(0.5);
  const [reverbValue, setReverbValue] = useState(0.5);
  const [screenMessage, setScreenMessage] = useState('Welcome to MPC');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [bpm, setBpm] = useState(120);
  const [loopActive, setLoopActive] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedPadIndex, setSelectedPadIndex] = useState<number | null>(null);

  const keyMapping: { [key: string]: number } = {
    '1': 0, '2': 1, '3': 2, '4': 3,
    'q': 4, 'w': 5, 'e': 6, 'r': 7,
    'a': 8, 's': 9, 'd': 10, 'f': 11,
    'z': 12, 'x': 13, 'c': 14, 'v': 15
  };

  const handleToneChange = (value: number) => {
    setToneValue(value);
    applyToneFilter(value);
    updateScreen(`Tone: ${Math.round(value * 100)}%`);
  };

  const handlePitchChange = (value: number) => {
    setPitchValue(value);
    applyPitch(value);
    updateScreen(`Pitch: ${Math.round(value * 100)}%`);
  };

  const handleFilterChange = (value: number) => {
    setFilterValue(value);
    applyFilter(value);
    updateScreen(`Filter: ${Math.round(value * 100)}%`);
  };

  const handleReverbChange = (value: number) => {
    setReverbValue(value);
    applyReverb(value);
    updateScreen(`Reverb: ${Math.round(value * 100)}%`);
  };

  const updateScreen = (message: string) => {
    setScreenMessage(message);
  };

  const triggerPad = async (index: number) => {
    const sound = padSounds[index];
    if (sound) {
      try {
        const buffer = await loadSoundBuffer(sound);
        if (buffer) {
          playSound(buffer);
          updateScreen(`Playing: ${sound.name}`);
        }
      } catch (err) {
        console.error('Error playing sound:', err);
      }
    }
  };

  const handlePadAIGenerate = (index: number) => {
    setSelectedPadIndex(index);
    setShowAIModal(true);
  };

  const handlePadDelete = async (index: number) => {
    const sound = padSounds[index];
    if (sound) {
      await deleteSound(sound.id);
      updateScreen(`Removed sound from pad ${index + 1}`);
    }
  };

  const handleBpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = Math.min(200, Math.max(60, parseInt(event.target.value) || 60));
    setBpm(newBpm);
    updateScreen(`BPM: ${newBpm}`);
  };

  const handleStartRecording = async () => {
    if (!isRecording) {
      startRecording();
      updateScreen('Recording...');
    } else {
      const recordedBlob = await stopRecording();
      updateScreen('Recording stopped');
      console.log('Recorded audio blob:', recordedBlob);
    }
  };

  const handleOverdub = () => {
    if (!isOverdubbing) {
      startOverdub();
      updateScreen('Overdubbing...');
    } else {
      stopOverdub();
      updateScreen('Overdub stopped');
    }
  };

  const handlePlayback = () => {
    togglePlayback();
    updateScreen(isPlaying ? 'Playback stopped' : 'Playing...');
  };

  const handlePlayStart = () => {
    playFromStart();
    updateScreen('Playing from start...');
  };

  const toggleLoop = () => {
    setLoopActive(!loopActive);
    updateScreen(`Loop: ${!loopActive ? 'ON' : 'OFF'}`);
  };

  const toggleKeyboardControl = () => {
    setKeyboardEnabled(!keyboardEnabled);
    updateScreen(`Keyboard Control: ${!keyboardEnabled ? 'ON' : 'OFF'}`);
  };

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!keyboardEnabled) return;
      
      const key = event.key.toLowerCase();
      if (keyMapping.hasOwnProperty(key) && !activeKeys.has(key)) {
        setActiveKeys(new Set(activeKeys).add(key));
        await triggerPad(keyMapping[key]);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!keyboardEnabled) return;
      
      const key = event.key.toLowerCase();
      if (keyMapping.hasOwnProperty(key)) {
        const newActiveKeys = new Set(activeKeys);
        newActiveKeys.delete(key);
        setActiveKeys(newActiveKeys);
      }
    };

    if (keyboardEnabled) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardEnabled, activeKeys]);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4CAF50',
        progressColor: '#2E7D32',
        cursorColor: '#81C784',
        height: 200,
        normalize: true,
      });

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <div className="mpc-container w-[1800px] max-w-[95vw]">
        <div className="flex justify-between items-center mb-8">
          <div className="text-white text-2xl font-bold tracking-tight">
            BOLTxELEVENLABS_<span className="text-[#4CAF50]">beat-machine</span>
            <span className="text-sm ml-2 text-gray-400">v1.1</span>
          </div>
          
          {!isKeyConfigured && (
            <Link 
              to="/studio" 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
            >
              Configure API Key
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-[300px_1fr_300px] gap-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center justify-around py-4 bg-black bg-opacity-20 rounded-xl p-4">
              <Slider 
                value={masterVolume} 
                onChange={setMasterVolume} 
                min={0} 
                max={1} 
                label="MAIN VOL" 
              />
              
              <Slider 
                value={toneValue} 
                onChange={handleToneChange} 
                min={0} 
                max={1} 
                label="TONE" 
              />
              
              <Slider 
                value={pitchValue} 
                onChange={handlePitchChange} 
                min={0} 
                max={1} 
                label="PITCH" 
              />
              
              <Slider 
                value={filterValue} 
                onChange={handleFilterChange} 
                min={0} 
                max={1} 
                label="FILTER" 
              />
              
              <Slider 
                value={reverbValue} 
                onChange={handleReverbChange} 
                min={0} 
                max={1} 
                label="REVERB" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-black bg-opacity-20 rounded-xl p-4">
              <button 
                className={`transport-button ${isRecording ? 'active' : ''}`}
                onClick={handleStartRecording}
              >
                {isRecording ? 'STOP REC' : 'REC'}
              </button>
              
              <button 
                className={`transport-button ${isOverdubbing ? 'active' : ''}`}
                onClick={handleOverdub}
              >
                {isOverdubbing ? 'STOP DUB' : 'OVERDUB'}
              </button>
              
              <button 
                className="transport-button"
                onClick={() => stopAllSounds()}
              >
                STOP
              </button>
              
              <button 
                className={`transport-button ${isPlaying ? 'active' : ''}`}
                onClick={handlePlayback}
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              
              <button 
                className="transport-button"
                onClick={handlePlayStart}
              >
                PLAY START
              </button>
              
              <button 
                className={`transport-button ${keyboardEnabled ? 'active' : ''}`}
                onClick={toggleKeyboardControl}
              >
                {keyboardEnabled ? 'KEYS ON' : 'KEYS OFF'}
              </button>
              
              <button 
                className="transport-button"
                onClick={() => stopAllSounds()}
              >
                MUTE
              </button>
              
              <button 
                className={`transport-button ${loopActive ? 'active' : ''}`}
                onClick={toggleLoop}
              >
                {loopActive ? 'LOOP ON' : 'LOOP OFF'}
              </button>
              
              <Link 
                to="/studio" 
                className="transport-button flex items-center justify-center gap-2"
              >
                <Settings size={20} />
                MENU
              </Link>
              
              <button className="transport-button">PROG EDIT</button>
              <button className="transport-button">GRID</button>
              <button className="transport-button">MIXER</button>
            </div>
          </div>
          
          <div className="flex flex-col gap-8">
            <div className="screen">
              <div className="text-[#4CAF50] text-2xl font-bold mb-4">{screenMessage}</div>
              <div ref={waveformRef} className="w-full h-[200px]"></div>
            </div>
            
            <div className="grid grid-cols-4 gap-8 p-8 bg-black bg-opacity-20 rounded-xl">
              {Array.from({ length: 16 }).map((_, index) => {
                const sound = padSounds[index];
                const key = Object.keys(keyMapping).find(k => keyMapping[k] === index);
                return (
                  <Pad 
                    key={index} 
                    index={index}
                    isActive={activeKeys.has(key || '')}
                    hasSound={!!sound}
                    soundName={sound?.name || ''}
                    label={key?.toUpperCase() || ''}
                    onTrigger={() => triggerPad(index)}
                    onAIGenerate={() => handlePadAIGenerate(index)}
                    onDelete={() => handlePadDelete(index)}
                  />
                );
              })}
            </div>
          </div>
          
          <div className="flex flex-col justify-between gap-8">
            <div className="flex flex-col items-center gap-2 bg-black bg-opacity-20 rounded-xl p-4">
              <input
                type="number"
                value={bpm}
                onChange={handleBpmChange}
                min={60}
                max={200}
                className="w-24 px-3 py-2 bg-black text-white rounded-md text-center text-xl"
              />
              <div className="text-white text-sm">BPM</div>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-black bg-opacity-20 rounded-xl p-4">
              <div className="data-wheel">
                <div className="knob-indicator"></div>
              </div>
              <div className="text-white text-sm">DATA WHEEL</div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <button 
                className="transport-button py-3 px-4 text-sm min-w-[100px]"
                onClick={() => updateScreen('Shift Activated')}
              >
                SHIFT
              </button>
              <button 
                className="transport-button py-3 px-4 text-sm min-w-[100px]"
                onClick={() => updateScreen('Tap Tempo')}
              >
                TAP
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showAIModal && selectedPadIndex !== null && (
        <AIGenerateModal 
          padIndex={selectedPadIndex}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
};

export default MpcInterface;