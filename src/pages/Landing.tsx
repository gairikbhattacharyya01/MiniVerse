import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [headingText, setHeadingText] = useState('Happening now');
  const [showHeading, setShowHeading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLight, setIsLight] = useState(() => localStorage.getItem("theme") === "light");

  // Rotating header text
  useEffect(() => {
    const texts = ['Happening now', 'Express freely', 'Build your voice'];
    let index = 0;

    const interval = setInterval(() => {
      setShowHeading(false);

      setTimeout(() => {
        index = (index + 1) % texts.length;
        setHeadingText(texts[index]);
        setShowHeading(true);
      }, 300);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Simulator for the initial page loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextLight = !isLight;
    setIsLight(nextLight);
    localStorage.setItem("theme", nextLight ? "light" : "dark");
    if (nextLight) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  };

  useEffect(() => {
    if (isLight) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [isLight]);

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans transition-all duration-500 bg-gradient-to-br ${isLight ? 'from-[#f5efe6] to-[#e6dccf] text-[#1a1a1a]' : 'from-[#000000] to-[#071a26] text-white'}`}>
      
      {/* THEME TOGGLE BUTTON */}
      <button 
        onClick={toggleTheme} 
        className={`absolute top-5 right-5 w-[55px] h-[45px] rounded-[25px] border-none flex items-center justify-center text-xl cursor-pointer z-50 transition-all duration-300 shadow-md ${
          isLight 
            ? 'bg-black/5 border border-black/10 text-slate-800 hover:scale-105 active:scale-95' 
            : 'bg-white/8 backdrop-blur-md border border-white/10 text-white hover:scale-105 active:scale-95'
        }`}
        aria-label="Toggle theme"
      >
        {isLight ? '☀️' : '🌙'}
      </button>

      {/* PAGE LOADER */}
      {loading && (
        <div className="fixed inset-0 w-full h-full bg-black flex justify-center items-center z-50 transition-opacity duration-600">
          <div className="text-3xl font-black bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] bg-clip-text text-transparent transform scale-110 animate-pulse">
            MiniVerse
          </div>
        </div>
      )}

      {/* PARTICLES */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="particles">
          <span style={{ left: '10%', animationDelay: '0s', animationDuration: '12s' }}></span>
          <span style={{ left: '20%', animationDelay: '2s', animationDuration: '18s' }}></span>
          <span style={{ left: '30%', animationDelay: '1s', animationDuration: '10s' }}></span>
          <span style={{ left: '40%', animationDelay: '4s', animationDuration: '16s' }}></span>
          <span style={{ left: '50%', animationDelay: '0s', animationDuration: '13s' }}></span>
          <span style={{ left: '60%', animationDelay: '3s', animationDuration: '20s' }}></span>
          <span style={{ left: '70%', animationDelay: '1.5s', animationDuration: '14s' }}></span>
          <span style={{ left: '80%', animationDelay: '5s', animationDuration: '17s' }}></span>
          <span style={{ left: '90%', animationDelay: '2s', animationDuration: '11s' }}></span>
          <span style={{ left: '95%', animationDelay: '0.5s', animationDuration: '15s' }}></span>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* LEFT PANEL */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-20 py-12 md:py-0 text-left md:items-start items-center md:text-left text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-[#1d9bf0] to-[#00d4ff] bg-clip-text text-transparent animate-pulse duration-[3000ms]">
            Mini<span className="bg-gradient-to-r from-[#00ffd5] to-[#00c3ff] bg-clip-text text-transparent animate-logo-glow">Verse</span>
          </h1>
          <p className={`mt-6 text-xl md:text-2xl font-semibold tracking-wide animate-tag transition-colors duration-500 ${isLight ? 'text-[#555]' : 'text-[#aaa]'}`}>
            Say Less. Mean More.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className={`flex-1 flex flex-col justify-center px-6 md:px-20 py-12 md:py-0 transition-all duration-500 border-t md:border-t-0 md:border-l shadow-[-10px_0_30px_rgba(0,0,0,0.2)] md:items-start items-center md:text-left text-center ${isLight ? 'bg-white/45 border-black/5' : 'bg-white/5 border-white/10'}`}>
          <h1 className={`text-5xl md:text-7xl font-black transition-all duration-300 transform ${showHeading ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'} ${isLight ? 'text-slate-800' : 'text-[#a0caec]/90'}`}>
            {headingText}
          </h1>
          <h2 className={`text-3xl md:text-4xl font-extrabold mt-4 mb-10 transition-colors duration-500 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
            Join today
          </h2>

          <div className="flex flex-col gap-4 w-full max-w-[320px]">
            <Link 
              to="/signup" 
              className="relative overflow-hidden group py-4 rounded-full text-center bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Create account
            </Link>
            <Link 
              to="/login" 
              className={`py-4 rounded-full text-center border font-bold text-lg hover:scale-105 active:scale-95 transition-all duration-300 ${
                isLight 
                  ? 'border-black/10 bg-black/5 text-[#1a1a1a] hover:bg-black/10' 
                  : 'border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10'
              }`}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={`absolute bottom-6 left-1/2 md:left-auto md:right-8 transform -translate-x-1/2 md:translate-x-0 z-10 text-sm font-medium transition-colors duration-500 ${isLight ? 'text-slate-500' : 'text-[#888]'}`}>
        © 2026{' '}
        <a href="#" className="text-[#00ffd5] hover:underline font-semibold ml-1">
          Team MiniVerse
        </a>
        . All rights reserved.
      </footer>
    </div>
  );
}
