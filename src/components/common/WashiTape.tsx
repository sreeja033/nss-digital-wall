import React from 'react';

interface WashiTapeProps {
  color?: 'mint' | 'yellow' | 'peach';
  className?: string;
  rotation?: number;
  width?: string;
}

export const WashiTape: React.FC<WashiTapeProps> = ({
  color = 'mint',
  className = '',
  rotation = 0,
  width = 'w-20',
}) => {
  const colorMap = {
    mint: 'bg-[#B8EADE]/80 border-t border-b border-[#38665E]/20',
    yellow: 'bg-[#FCBB4A]/70 border-t border-b border-[#7B5300]/20',
    peach: 'bg-[#FFDBD1]/85 border-t border-b border-[#A03818]/20',
  };

  return (
    <div
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`h-4.5 ${width} ${colorMap[color]} shadow-sm backdrop-blur-xs select-none pointer-events-none ${className}`}
    >
      {/* Torn jagged edges */}
      <div className="w-full h-full flex items-center justify-between opacity-40 px-1 text-[8px] font-mono tracking-widest text-black/50">
        <span>/ / /</span>
        <span>/ / /</span>
      </div>
    </div>
  );
};
