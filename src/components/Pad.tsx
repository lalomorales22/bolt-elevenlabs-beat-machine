import React, { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import AIGenerateModal from './AIGenerateModal';

interface PadProps {
  index: number;
  isActive: boolean;
  hasSound: boolean;
  soundName: string;
  label: string;
  onTrigger: () => void;
  onAIGenerate: () => void;
  onDelete: () => void;
}

const Pad: React.FC<PadProps> = ({
  index,
  isActive,
  hasSound,
  soundName,
  label,
  onTrigger,
  onAIGenerate,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAIGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAIGenerate();
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <div 
        className={`pad ${isActive ? 'active' : ''} ${hasSound ? 'has-sound' : ''}`}
        onMouseDown={onTrigger}
        onTouchStart={onTrigger}
      >
        <div className="absolute top-2 right-2 z-10">
          {hasSound && (
            <button
              onClick={handleMenuClick}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical size={16} />
            </button>
          )}
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-20">
              <button
                onClick={handleAIGenerate}
                className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700"
              >
                Generate AI Sound
              </button>
              {hasSound && (
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-700"
                >
                  Remove Sound
                </button>
              )}
            </div>
          )}
        </div>

        {!hasSound ? (
          <button
            onClick={handleAIGenerate}
            className="absolute inset-0 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <Plus size={24} />
          </button>
        ) : (
          <>
            <div className="text-white font-bold text-lg mb-2">{label}</div>
            <div className="text-xs text-gray-400 truncate max-w-[80%] text-center">
              {soundName}
            </div>
          </>
        )}
      </div>

      {showAIModal && (
        <AIGenerateModal 
          padIndex={index}
          onClose={() => {
            setShowAIModal(false);
            setShowMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default Pad;