import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useSoundLibrary } from '../contexts/SoundLibraryContext';
import { generateSoundEffect } from '../services/elevenlabsApi';

interface AIGenerateModalProps {
  padIndex: number;
  onClose: () => void;
}

const AIGenerateModal: React.FC<AIGenerateModalProps> = ({ padIndex, onClose }) => {
  const { apiKey } = useApiKey();
  const { saveSound, assignSoundToPad } = useSoundLibrary();
  
  const [soundName, setSoundName] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [duration, setDuration] = useState<string>('1.5');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('API key not configured. Please set it up in the Sound Studio.');
      return;
    }

    if (!soundName) {
      setError('Please provide a name for your sound.');
      return;
    }

    if (!customPrompt) {
      setError('Please provide a description for your sound.');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      
      const durationValue = parseFloat(duration);
      if (isNaN(durationValue) || durationValue < 0.5 || durationValue > 22) {
        setError('Duration must be between 0.5 and 22 seconds.');
        return;
      }
      
      const audioBlob = await generateSoundEffect(apiKey, customPrompt, durationValue);
      const sound = await saveSound(soundName, audioBlob, 'custom');
      await assignSoundToPad(padIndex, sound);
      
      onClose();
    } catch (err) {
      console.error('Error generating sound:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Generate AI Sound for Pad {padIndex + 1}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-600 text-red-100 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-white mb-2">Sound Name</label>
          <input
            type="text"
            value={soundName}
            onChange={(e) => setSoundName(e.target.value)}
            placeholder="Enter a name for your sound"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">Sound Description</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the sound you want to generate..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">Duration (seconds)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="0.5"
            max="22"
            step="0.1"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-400 text-xs mt-1">Must be between 0.5 and 22 seconds</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
              isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-500'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Generate Sound'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGenerateModal;