import React from 'react';

interface PushpinProps {
  color?: 'rust' | 'teal' | 'mustard' | 'brass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  shadow?: boolean;
}

export const Pushpin: React.FC<PushpinProps> = ({
  color = 'rust',
  size = 'md',
  className = '',
  shadow = true,
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
  };

  const colorMap = {
    rust: 'bg-[radial-gradient(circle_at_35%_30%,#ff886c_10%,#A03818_60%,#5e1400_100%)] border-[#7a1c02]',
    teal: 'bg-[radial-gradient(circle_at_35%_30%,#79b0a7_10%,#38665E_60%,#133731_100%)] border-[#1b4b43]',
    mustard: 'bg-[radial-gradient(circle_at_35%_30%,#ffe08c_10%,#E8A93A_60%,#694400_100%)] border-[#7b5300]',
    brass: 'bg-[radial-gradient(circle_at_35%_30%,#fae7b5_10%,#c59b27_60%,#5a4106_100%)] border-[#6a4f08]',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
    >
      {/* Pin needle drop shadow */}
      {shadow && (
        <span
          className="absolute w-2 h-2.5 bg-black/35 rounded-full blur-[1.2px] -bottom-1 -right-1 pointer-events-none"
        />
      )}
      {/* Pin Head */}
      <span
        className={`${sizeMap[size]} ${colorMap[color]} rounded-full border border-black/20 relative shadow-[0_2px_4px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.7)] flex items-center justify-center`}
      >
        {/* Specular Glint */}
        <span className="absolute top-[20%] left-[24%] w-[28%] h-[28%] bg-white/90 rounded-full blur-[0.3px]" />
      </span>
    </div>
  );
};
