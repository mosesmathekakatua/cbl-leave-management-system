
import React from 'react';

const Logo: React.FC<{ size?: string, className?: string }> = ({ size = 'w-12 h-12', className = '' }) => {
  return (
    <div className={`${size} ${className} relative flex items-center justify-center bg-[#facc15] rounded-full overflow-hidden border-2 border-gray-200 shadow-sm`}>
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <path d="M50 20 L80 50 L80 85 L20 85 L20 50 Z" fill="none" stroke="#065f46" strokeWidth="8" />
        <rect x="42" y="55" width="16" height="30" fill="#065f46" />
        <path d="M50 25 L75 50 L75 80 L25 80 L25 50 Z" fill="none" stroke="#059669" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default Logo;
