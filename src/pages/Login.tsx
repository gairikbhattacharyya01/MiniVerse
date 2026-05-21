import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLight, setIsLight] = useState(() => localStorage.getItem("theme") === "light");
  const navigate = useNavigate();

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

  React.useEffect(() => {
    if (isLight) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [isLight]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Wait a moment for onAuthStateChanged to trigger, or instantly navigate
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email first to receive a password reset link.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset link sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans flex flex-col justify-center items-center p-6 transition-all duration-500 bg-gradient-to-br ${isLight ? 'from-[#f7f3eb] to-[#e8e0d4] text-[#111111]' : 'from-[#000000] to-[#071a26] text-white'}`}>
      
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

      {/* LOGO LINK */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-10 text-3xl md:text-4xl font-black bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] bg-clip-text text-transparent hover:scale-105 active:scale-95 transition-all text-glow z-20 cursor-pointer animate-logo-glow"
      >
        MiniVerse
      </button>

      {/* LOGIN BOX */}
      <div className={`relative z-10 w-full max-w-[450px] p-8 md:p-12 rounded-[30px] border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 transition-all duration-500 ${isLight ? 'bg-white/55 border-slate-200 shadow-slate-300/40 text-[#111111]' : 'bg-white/5 border-white/12 shadow-black/25 text-white'}`}>
        <h2 className={`text-3xl md:text-4xl font-black tracking-tight mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>Welcome Back</h2>
        <p className={`font-medium mb-8 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Log in to MiniVerse</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-sm p-4 rounded-xl mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={`w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#00ffd5] focus:ring-1 focus:ring-[#00ffd5] transition-all placeholder-slate-500 ${isLight ? 'bg-white/40 border-slate-300 text-[#111111]' : 'bg-white/12 text-white'}`}
            />
          </div>

          <div className="space-y-1">
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#00ffd5] focus:ring-1 focus:ring-[#00ffd5] transition-all placeholder-slate-500 ${isLight ? 'bg-white/40 border-slate-300 text-[#111111]' : 'bg-white/12 text-white'}`}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 rounded-full bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg shadow-[#00ffd5]/10"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={`mt-8 flex justify-between text-sm select-none ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <button 
            type="button"
            onClick={handleForgotPassword}
            className="text-[#1d9bf0] hover:underline font-semibold"
          >
            Forgot password?
          </button>

          <Link to="/signup" className="text-[#1d9bf0] hover:underline font-semibold">
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
}
