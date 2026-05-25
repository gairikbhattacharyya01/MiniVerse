import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Eye, EyeOff, MailCheck } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validations based on user's HTML client-side code
    const today = new Date();
    const birthDateObj = new Date(birthdate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 18) {
      setError("Age must be at least 18 to create an account");
      setLoading(false);
      return;
    }

    if (/fuck|shit|bitch|ass/i.test(name)) {
      setError("Invalid name");
      setLoading(false);
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(password)) {
      setError("Weak password! Must contain at least 8 characters, with letters and numbers.");
      setLoading(false);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await updateProfile(user, { displayName: name });

      // Create profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        username: email.split('@')[0],
        birthdate: birthdate,
        followers: [],
        following: [],
        createdAt: serverTimestamp()
      });

      // Send verification email
      await sendEmailVerification(user);
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-y-auto font-sans transition-all duration-500 bg-gradient-to-br ${isLight ? 'from-[#f7f3eb] to-[#e8e0d4] text-[#111111]' : 'from-[#000000] to-[#071a26] text-white'}`}>
      
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
          <span style={{ left: '25%', animationDelay: '2s', animationDuration: '18s' }}></span>
          <span style={{ left: '33%', animationDelay: '1s', animationDuration: '10s' }}></span>
          <span style={{ left: '45%', animationDelay: '4s', animationDuration: '16s' }}></span>
          <span style={{ left: '52%', animationDelay: '0s', animationDuration: '13s' }}></span>
          <span style={{ left: '60%', animationDelay: '3s', animationDuration: '20s' }}></span>
          <span style={{ left: '72%', animationDelay: '1.5s', animationDuration: '14s' }}></span>
          <span style={{ left: '81%', animationDelay: '5s', animationDuration: '17s' }}></span>
          <span style={{ left: '88%', animationDelay: '2s', animationDuration: '11s' }}></span>
          <span style={{ left: '95%', animationDelay: '0.5s', animationDuration: '15s' }}></span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen w-full">
        {/* LEFT PANEL */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-20 py-12 lg:py-0 text-left lg:items-start items-center lg:text-left text-center">
          <div className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] bg-clip-text text-transparent mb-6 animate-logo-glow">
            MiniVerse
          </div>

          <h1 className={`text-3xl md:text-5xl font-black leading-tight mb-6 max-w-[450px] transition-colors duration-500 ${isLight ? 'text-[#111111]' : 'text-white'}`}>
            Join the conversation
          </h1>

          <p className={`text-sm md:text-lg max-w-[550px] leading-relaxed transition-colors duration-500 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Share thoughts, connect with people, express freely.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex justify-center items-center px-6 md:px-20 py-12 lg:py-0">
          <div className={`w-full max-w-[430px] p-8 md:p-10 rounded-[30px] border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 transition-all duration-500 ${isLight ? 'bg-white/55 border-slate-200 shadow-slate-300/40 text-[#111111]' : 'bg-white/5 border-white/10 shadow-black/25 text-white'}`}>
            {verificationSent ? (
              <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <MailCheck size={36} className="animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-emerald-400">Verification Sent!</h3>
                  <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    We have successfully created your account and sent a verification link to your email:<br />
                    <span className="font-bold text-indigo-450 text-[#1d9bf0]">{email}</span>
                  </p>
                  <p className={`text-[11px] leading-relaxed font-sans ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Please check your inbox (and junk/spam folder) and follow the instructions to verify your account.
                  </p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-full bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg shadow-[#00ffd5]/10"
                  >
                    Enter MiniVerse
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className={`text-3xl font-black mb-8 tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Create Account</h2>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-4 rounded-xl mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1">
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className={`w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#00ffd5] focus:ring-1 focus:ring-[#00ffd5] transition-all placeholder-slate-500 ${isLight ? 'bg-white/40 border-slate-300 text-[#111111]' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ml-2 block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Birthdate</label>
                    <input 
                      type="date"
                      required
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className={`w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#00ffd5] focus:ring-1 focus:ring-[#00ffd5] transition-all ${isLight ? 'bg-white/40 border-slate-300 text-[#111111]' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className={`w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#00ffd5] focus:ring-1 focus:ring-[#00ffd5] transition-all placeholder-slate-500 ${isLight ? 'bg-white/40 border-slate-300 text-[#111111]' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className={`w-full border rounded-xl pl-5 pr-12 py-4 focus:outline-none focus:border-[#00ffd5] focus:ring-1 focus:ring-[#00ffd5] transition-all placeholder-slate-500 ${isLight ? 'bg-white/40 border-slate-300 text-[#111111]' : 'bg-white/5 border-white/10 text-white'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-6 rounded-full bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg shadow-[#00ffd5]/10"
                  >
                    {loading ? 'Creating...' : 'Signup'}
                  </button>
                </form>

                <div className={`mt-8 text-center text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#1d9bf0] hover:underline font-semibold ml-1">
                    Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
