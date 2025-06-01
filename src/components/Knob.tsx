import React, { useState, useEffect, useRef } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
}

const Slider: React.FC<SliderProps> = ({ 
  value, 
  onChange, 
  min, 
  max, 
  label
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartValue(value);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setStartValue(value);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && sliderRef.current) {
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const sliderWidth = sliderRect.width;
      const deltaX = e.clientX - startX;
      const deltaValue = (deltaX / sliderWidth) * (max - min);
      let newValue = Math.min(max, Math.max(min, startValue + deltaValue));
      onChange(newValue);

      // Animate the handle
      if (handleRef.current) {
        handleRef.current.style.transform = `translate(-50%, -50%) scale(0.95)`;
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && sliderRef.current) {
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const sliderWidth = sliderRect.width;
      const deltaX = e.touches[0].clientX - startX;
      const deltaValue = (deltaX / sliderWidth) * (max - min);
      let newValue = Math.min(max, Math.max(min, startValue + deltaValue));
      onChange(newValue);

      // Animate the handle
      if (handleRef.current) {
        handleRef.current.style.transform = `translate(-50%, -50%) scale(0.95)`;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    // Reset handle animation
    if (handleRef.current) {
      handleRef.current.style.transform = `translate(-50%, -50%) scale(1)`;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    
    // Reset handle animation
    if (handleRef.current) {
      handleRef.current.style.transform = `translate(-50%, -50%) scale(1)`;
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="text-white text-center mb-2">{label}</div>
      <div
        ref={sliderRef}
        className="slider-track"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none' }}
      >
        <div 
          className="slider-progress"
          style={{ width: `${percentage}%` }}
        />
        <div 
          ref={handleRef}
          className="slider-handle"
          style={{ 
            left: `${percentage}%`,
            transition: isDragging ? 'none' : 'all 0.1s ease'
          }}
        />
      </div>
      <div className="text-gray-400 text-sm text-center mt-1">
        {Math.round(value * 100)}%
      </div>
    </div>
  );
};

export default Slider;