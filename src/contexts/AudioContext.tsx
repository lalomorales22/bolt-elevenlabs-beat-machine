import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface AudioContextProps {
  audioContext: AudioContext | null;
  masterGainNode: GainNode | null;
  playSound: (buffer: AudioBuffer) => void;
  stopAllSounds: () => void;
  applyToneFilter: (value: number) => void;
  applyPitch: (value: number) => void;
  applyFilter: (value: number) => void;
  applyReverb: (value: number) => void;
  masterVolume: number;
  setMasterVolume: (value: number) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<Blob>;
  isPlaying: boolean;
  togglePlayback: () => void;
  recordedChunks: Blob[];
  isOverdubbing: boolean;
  startOverdub: () => void;
  stopOverdub: () => void;
  playFromStart: () => void;
}

const AudioContextInstance = createContext<AudioContextProps | undefined>(undefined);

export const useAudioContext = () => {
  const context = useContext(AudioContextInstance);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [masterGain, setMasterGain] = useState<GainNode | null>(null);
  const [toneFilter, setToneFilter] = useState<BiquadFilterNode | null>(null);
  const [masterVolume, setMasterVolume] = useState<number>(0.7);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOverdubbing, setIsOverdubbing] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  const activeSources = useRef<AudioBufferSourceNode[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const destinationStreamRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recordedBuffersRef = useRef<AudioBuffer[]>([]);
  const playbackStartTime = useRef<number>(0);

  useEffect(() => {
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    setAudioCtx(ctx);
    setMasterGain(gainNode);
    setToneFilter(filter);
    
    const destinationStream = ctx.createMediaStreamDestination();
    gainNode.connect(destinationStream);
    destinationStreamRef.current = destinationStream;
    
    return () => {
      ctx.close();
    };
  }, []);

  useEffect(() => {
    if (masterGain) {
      masterGain.gain.value = masterVolume;
    }
  }, [masterVolume, masterGain]);

  const playSound = (buffer: AudioBuffer) => {
    if (audioCtx) {
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(toneFilter!);
      source.start(0);
      activeSources.current.push(source);
      
      if (isRecording || isOverdubbing) {
        recordedBuffersRef.current.push(buffer);
      }
      
      source.onended = () => {
        activeSources.current = activeSources.current.filter(s => s !== source);
      };
    }
  };

  const stopAllSounds = () => {
    activeSources.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Handle any errors when stopping sources
      }
    });
    activeSources.current = [];
    setIsPlaying(false);
    setIsRecording(false);
    setIsOverdubbing(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = () => {
    if (destinationStreamRef.current && !isRecording && !isOverdubbing) {
      chunksRef.current = [];
      recordedBuffersRef.current = [];
      const mediaRecorder = new MediaRecorder(destinationStreamRef.current.stream);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      playbackStartTime.current = audioCtx!.currentTime;
    }
  };

  const stopRecording = async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
          setRecordedChunks(chunksRef.current);
          setIsRecording(false);
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(new Blob());
      }
    });
  };

  const startOverdub = () => {
    if (!isRecording && !isOverdubbing) {
      setIsOverdubbing(true);
      recordedBuffersRef.current = [];
      playbackStartTime.current = audioCtx!.currentTime;
    }
  };

  const stopOverdub = () => {
    setIsOverdubbing(false);
  };

  const togglePlayback = () => {
    if (!isPlaying && recordedBuffersRef.current.length > 0) {
      setIsPlaying(true);
      playbackStartTime.current = audioCtx!.currentTime;
      
      recordedBuffersRef.current.forEach(buffer => {
        const source = audioCtx!.createBufferSource();
        source.buffer = buffer;
        source.connect(toneFilter!);
        source.start();
        activeSources.current.push(source);
      });
    } else {
      stopAllSounds();
    }
  };

  const playFromStart = () => {
    stopAllSounds();
    setIsPlaying(true);
    playbackStartTime.current = audioCtx!.currentTime;
    
    if (recordedBuffersRef.current.length > 0) {
      recordedBuffersRef.current.forEach(buffer => {
        const source = audioCtx!.createBufferSource();
        source.buffer = buffer;
        source.connect(toneFilter!);
        source.start();
        activeSources.current.push(source);
      });
    }
  };

  const applyToneFilter = (value: number) => {
    if (toneFilter) {
      const freq = 100 + value * 19900;
      toneFilter.frequency.setValueAtTime(freq, audioCtx!.currentTime);
    }
  };

  const applyPitch = (value: number) => {
    activeSources.current.forEach(source => {
      const pitchRate = 0.5 + value * 1.5;
      source.playbackRate.setValueAtTime(pitchRate, audioCtx!.currentTime);
    });
  };

  const applyFilter = (value: number) => {
    if (toneFilter) {
      const q = 0.1 + value * 29.9;
      toneFilter.Q.setValueAtTime(q, audioCtx!.currentTime);
    }
  };

  const applyReverb = (value: number) => {
    // Basic reverb implementation
    console.log('Reverb set to:', value);
  };

  return (
    <AudioContextInstance.Provider value={{
      audioContext: audioCtx,
      masterGainNode: masterGain,
      playSound,
      stopAllSounds,
      applyToneFilter,
      applyPitch,
      applyFilter,
      applyReverb,
      masterVolume,
      setMasterVolume,
      isRecording,
      startRecording,
      stopRecording,
      isPlaying,
      togglePlayback,
      recordedChunks,
      isOverdubbing,
      startOverdub,
      stopOverdub,
      playFromStart
    }}>
      {children}
    </AudioContextInstance.Provider>
  );
};