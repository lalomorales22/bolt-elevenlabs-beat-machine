import React, { createContext, useContext, useState, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface Sound {
  id: string;
  name: string;
  audioData: Blob;
  created: Date;
  category: string;
  buffer?: AudioBuffer;
}

interface SoundLibraryContextProps {
  sounds: Sound[];
  padSounds: (Sound | null)[];
  loadSound: (id: string) => Promise<Sound | undefined>;
  saveSound: (name: string, audioData: Blob, category: string) => Promise<Sound>;
  deleteSound: (id: string) => Promise<void>;
  assignSoundToPad: (padIndex: number, sound: Sound | null) => void;
  loadSoundBuffer: (sound: Sound) => Promise<AudioBuffer | undefined>;
}

const SoundLibraryContext = createContext<SoundLibraryContextProps | undefined>(undefined);

export const useSoundLibrary = () => {
  const context = useContext(SoundLibraryContext);
  if (context === undefined) {
    throw new Error('useSoundLibrary must be used within a SoundLibraryProvider');
  }
  return context;
};

const clearDatabase = async (db: IDBPDatabase) => {
  try {
    // Clear all objects from the sounds store
    const soundsTx = db.transaction('sounds', 'readwrite');
    await soundsTx.objectStore('sounds').clear();
    
    // Clear all objects from the padAssignments store
    const padsTx = db.transaction('padAssignments', 'readwrite');
    await padsTx.objectStore('padAssignments').clear();
    
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

export const SoundLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [padSounds, setPadSounds] = useState<(Sound | null)[]>(Array(16).fill(null));
  
  // Initialize IndexedDB and clear it
  useEffect(() => {
    const initDb = async () => {
      const database = await openDB('soundLibrary', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('sounds')) {
            db.createObjectStore('sounds', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('padAssignments')) {
            db.createObjectStore('padAssignments', { keyPath: 'padIndex' });
          }
        },
      });
      
      // Clear the database when initializing
      await clearDatabase(database);
      
      setDb(database);
      setSounds([]); // Reset sounds array
      setPadSounds(Array(16).fill(null)); // Reset pad assignments
    };
    
    initDb();
  }, []);
  
  const loadSound = async (id: string): Promise<Sound | undefined> => {
    if (!db) return undefined;
    return db.get('sounds', id);
  };
  
  const saveSound = async (name: string, audioData: Blob, category: string): Promise<Sound> => {
    if (!db) throw new Error('Database not initialized');
    
    const sound: Sound = {
      id: uuidv4(),
      name,
      audioData,
      created: new Date(),
      category
    };
    
    await db.put('sounds', sound);
    setSounds(prev => [...prev, sound]);
    return sound;
  };
  
  const deleteSound = async (id: string): Promise<void> => {
    if (!db) return;
    
    await db.delete('sounds', id);
    setSounds(prev => prev.filter(s => s.id !== id));
    
    setPadSounds(prev => {
      const newAssignments = [...prev];
      prev.forEach((sound, index) => {
        if (sound && sound.id === id) {
          newAssignments[index] = null;
          db.put('padAssignments', { padIndex: index, soundId: null });
        }
      });
      return newAssignments;
    });
  };
  
  const assignSoundToPad = async (padIndex: number, sound: Sound | null) => {
    if (!db) return;
    
    await db.put('padAssignments', { 
      padIndex, 
      soundId: sound ? sound.id : null 
    });
    
    setPadSounds(prev => {
      const newAssignments = [...prev];
      newAssignments[padIndex] = sound;
      return newAssignments;
    });
  };
  
  const loadSoundBuffer = async (sound: Sound): Promise<AudioBuffer | undefined> => {
    if (sound.buffer) return sound.buffer;
    
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await sound.audioData.arrayBuffer();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const updatedSound = { ...sound, buffer };
      setSounds(prev => prev.map(s => s.id === sound.id ? updatedSound : s));
      
      return buffer;
    } catch (error) {
      console.error('Error loading sound buffer:', error);
      return undefined;
    }
  };
  
  return (
    <SoundLibraryContext.Provider value={{
      sounds,
      padSounds,
      loadSound,
      saveSound,
      deleteSound,
      assignSoundToPad,
      loadSoundBuffer
    }}>
      {children}
    </SoundLibraryContext.Provider>
  );
};