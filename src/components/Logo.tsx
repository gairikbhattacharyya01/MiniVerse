import React from 'react';
import { Orbit } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const containerSize = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-16 h-16';
  const iconSize = size === 'sm' ? 18 : size === 'md' ? 22 : 36;
  const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-4xl';

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${containerSize} flex items-center justify-center`}>
        {/* Glowing Background */}
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[8px] opacity-40 group-hover:opacity-70 group-hover:blur-[12px] transition-all duration-500 animate-pulse"></div>
        
        {/* Core Logo */}
        <div className="relative w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)]"></div>
          <Orbit 
            size={iconSize} 
            className="text-white group-hover:rotate-180 transition-transform duration-1000 ease-in-out" 
          />
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSize} font-black tracking-tighter text-white text-glow group-hover:text-indigo-300 transition-colors`}>
            MiniVerse
          </span>
          <span className="text-[7px] font-bold tracking-[0.2em] text-indigo-400/80 uppercase leading-none mt-0.5">
            Say Less, Mean More
          </span>
        </div>
      )}
    </div>
  );
}
