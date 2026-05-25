import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Search, 
  Bell, 
  Mail, 
  User, 
  Sparkles, 
  LogOut,
  Hash,
  Menu,
  X
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, doc } from 'firebase/firestore';
import { Post as PostType, UserProfile } from '../types';
import Logo from './Logo';

interface LayoutProps {
  user: any;
}

export default function Layout({ user: authUser }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatLikePage = location.pathname === '/messages' || location.pathname === '/orion';
  const [unreadCount, setUnreadCount] = useState(0);
  const [trending, setTrending] = useState<PostType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [emailVerified, setEmailVerified] = useState(authUser?.emailVerified || false);
  const [resending, setResending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (authUser) {
      setEmailVerified(authUser.emailVerified);
    }
  }, [authUser]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSuccessMsg('Verification link resent successfully! Check your inbox.');
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyStatusCheck = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setEmailVerified(updatedUser.emailVerified);
      if (updatedUser.emailVerified) {
        setSuccessMsg('Congratulations! Your email has been successfully verified.');
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        alert('Email is still not verified. Please check your mailbox.');
      }
    }
  };

  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', authUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUserProfile(snapshot.data() as UserProfile);
      }
    });
    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', authUser.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), limit(50)); // Increased limit to find more potential trends
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PostType[];
      const sorted = posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      setTrending(sorted.slice(0, 5));
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      // Fetch up to 300 users to do filter client-side for true case-insensitive substring search in demo app
      const snap = await getDocs(query(usersRef, limit(300)));
      const allUsers = snap.docs.map(d => d.data() as UserProfile);
      
      const searchLower = val.toLowerCase().trim();
      const filtered = allUsers.filter(u => {
        const nameMatch = u.name?.toLowerCase().includes(searchLower);
        const usernameMatch = u.username?.toLowerCase().includes(searchLower);
        const emailMatch = u.email?.toLowerCase().includes(searchLower);
        return nameMatch || usernameMatch || emailMatch;
      });
      
      setSearchResults(filtered.slice(0, 8));
    } catch (err) {
      console.error("Search error in Layout:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Explore', path: '/explore', icon: Hash },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Messages', path: '/messages', icon: Mail },
    { name: 'Orion AI', path: '/orion', icon: Sparkles, color: 'text-indigo-400' },
    { name: 'Profile', path: `/profile/${authUser?.uid}`, icon: User },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full mx-auto overflow-hidden relative bg-[#0f172a]">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-md z-40 sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/5 active:scale-95 transition-all focus:outline-none cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="sm" showText={false} />
            <span className="text-xl font-black tracking-tighter text-white text-glow">MiniVerse</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/notifications')} className="text-white/40 p-2 relative">
             <Bell size={20} />
             {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-400 w-1.5 h-1.5 rounded-full ring-1 ring-[#0f172a]"></span>
             )}
          </button>
          <button onClick={handleLogout} className="text-white/30 hover:text-red-400 p-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sliding Sidebar Drawer */}
      <div 
        className={`md:hidden fixed top-0 bottom-0 left-0 w-[280px] sm:w-[320px] bg-[#0e1526] border-r border-white/10 p-5 flex flex-col gap-4 z-50 transition-transform duration-300 ease-out shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
            <Logo size="sm" />
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white active:scale-95 transition-all focus:outline-none cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Field in Mobile Side Drawer */}
        <div className="px-1 relative w-full mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-white" size={15} />
            <input 
              type="text"
              className="w-full bg-white/5 border border-white/10 py-2.5 pl-9 pr-3 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all placeholder-white/30"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 glass rounded-2xl overflow-hidden z-55 border border-white/10 animate-in fade-in slide-in-from-top-2 max-h-56 overflow-y-auto shadow-2xl">
              {searchResults.map(u => (
                <div 
                  key={u.uid}
                  onClick={() => {
                    navigate(`/profile/${u.uid}`);
                    setSearchResults([]);
                    setSearchQuery('');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 glass-hover cursor-pointer border-b border-white/5 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase text-white">{u.name[0]}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate text-white">{u.name}</div>
                    <div className="text-[10px] opacity-50 truncate text-slate-300">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
          {navItems.map((item: any) => (
            item.external ? (
              <a
                key={item.name}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center gap-3.5 p-3 rounded-xl transition-all glass-hover w-full text-white/70 hover:text-white
                  ${item.color || ''}
                `}
              >
                <item.icon size={20} />
                <span className="font-semibold text-sm">{item.name}</span>
              </a>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center justify-between p-3 rounded-xl transition-all glass-hover w-full
                  ${isActive ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' : 'text-white/75 hover:text-white'}
                  ${item.color || ''}
                `}
              >
                <div className="flex items-center gap-3.5">
                  <item.icon size={20} />
                  <span className="font-semibold text-sm">{item.name}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-[9px] px-1.5 py-0.5 rounded-full text-white font-bold h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          ))}
        </nav>

        {/* Footer info at bottom of mobile drawer */}
        <div className="mt-auto border-t border-white/5 pt-4 flex flex-col gap-3">
          <div className="glass p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0 overflow-hidden">
              {currentUserProfile?.photoURL ? (
                <img src={currentUserProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-600 text-xs font-bold uppercase text-white/50">
                  {currentUserProfile?.name?.[0] || authUser?.email?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-width-0">
              <div className="text-xs font-semibold truncate text-white">{currentUserProfile?.name || 'User'}</div>
              <div className="text-[10px] opacity-60 truncate text-slate-400">@{currentUserProfile?.username || authUser?.email?.split('@')[0]}</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/10 transition-all font-bold text-xs w-full cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-20 xl:w-64 h-full border-r border-white/10 p-4 xl:p-6 flex-col gap-2 shrink-0 transition-all duration-300">
        <div className="mb-8 cursor-pointer group flex justify-center xl:justify-start" onClick={() => navigate('/')}>
          <div className="xl:block hidden">
            <Logo />
          </div>
          <div className="xl:hidden block">
            <Logo size="sm" showText={false} />
          </div>
        </div>


        <nav className="flex flex-col gap-1 items-center xl:items-stretch">
          {/* Search Box */}
          <div className="px-1 xl:px-3 mb-4 relative w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 p-2 pl-9 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all xl:opacity-100 opacity-0 focus:opacity-100"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="absolute top-full left-3 right-3 mt-1 glass rounded-2xl overflow-hidden z-50 border border-white/10 animate-in fade-in slide-in-from-top-2">
                {searchResults.map(u => (
                  <div 
                    key={u.uid}
                    onClick={() => {
                      navigate(`/profile/${u.uid}`);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-3 glass-hover cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase">{u.name[0]}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{u.name}</div>
                      <div className="text-[10px] opacity-50 truncate">@{u.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {navItems.map((item: any) => (
            item.external ? (
              <a
                key={item.name}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center justify-center xl:justify-between p-3 rounded-xl transition-all glass-hover w-full
                  ${item.color || ''}
                `}
                title={item.name}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={22} />
                  <span className="font-medium xl:block hidden">{item.name}</span>
                </div>
              </a>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center justify-center xl:justify-between p-3 rounded-xl transition-all glass-hover w-full
                  ${isActive ? 'nav-active' : ''}
                  ${item.color || ''}
                `}
                title={item.name}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={22} />
                  <span className="font-medium xl:block hidden">{item.name}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full text-white xl:block hidden">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-4 flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl glass-hover text-red-400 transition-all text-left w-full"
          title="Logout"
        >
          <LogOut size={22} />
          <span className="font-medium xl:block hidden">Logout</span>
        </button>

        {/* User Card */}
        <div className="mt-auto glass p-2 xl:p-3 rounded-2xl flex items-center xl:gap-3 justify-center xl:justify-start">
          <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0 overflow-hidden">
            {currentUserProfile?.photoURL ? (
              <img src={currentUserProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-600 text-sm font-bold uppercase text-white/50">
                {currentUserProfile?.name?.[0] || authUser?.email?.[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-width-0 xl:block hidden">
            <div className="text-sm font-semibold truncate">{currentUserProfile?.name || 'User'}</div>
            <div className="text-xs opacity-60 truncate">@{currentUserProfile?.username || authUser?.email?.split('@')[0]}</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Verification banner if not verified */}
        {!emailVerified && authUser && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 md:px-6 py-2 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-200 gap-2 shrink-0 z-50 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/15 shrink-0">✉️</span>
              <span>Your email is not verified. Check your inbox for the verification link.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleResendVerification}
                disabled={resending}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-white font-bold transition-all disabled:opacity-50 text-[10px]"
              >
                {resending ? 'Sending...' : 'Resend Email'}
              </button>
              <button 
                onClick={handleVerifyStatusCheck}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold transition-all text-[10px]"
              >
                Check Status
              </button>
            </div>
          </div>
        )}
        
        {successMsg && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/20 px-4 md:px-6 py-1.5 text-center text-xs text-emerald-300 font-medium shrink-0 z-50 animate-in slide-in-from-top-2 duration-350">
            {successMsg}
          </div>
        )}

        {!emailVerified && authUser ? (
          <div className="flex-1 overflow-y-auto min-h-full pb-6 md:pb-20 pt-2 md:pt-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 md:p-10 rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <Mail size={38} className="animate-pulse" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white tracking-tight">Verify Your Email Address</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  To keep the MiniVerse secure and spam-free, we require all users to verify their email address before accessing features.
                </p>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center text-xs font-mono text-indigo-400 lg:tracking-wider select-all">
                  {authUser.email}
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-500/15 border-b border-emerald-500/20 px-4 py-2.5 rounded-xl text-center text-xs text-emerald-300 font-medium z-50 animate-in slide-in-from-top-2 duration-350">
                  {successMsg}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleVerifyStatusCheck}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#1d9bf0] to-[#00ffd5] text-white font-bold text-base hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg shadow-[#00ffd5]/10 cursor-pointer"
                >
                  I've Verified! Enter MiniVerse 🌌
                </button>
                
                <div className="flex gap-3">
                  <button
                    disabled={resending}
                    onClick={handleResendVerification}
                    className="flex-1 py-3 px-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs active:scale-95 transition-all text-center cursor-pointer disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend Email'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-3 px-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold text-xs active:scale-95 transition-all text-center cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex-1 ${isChatLikePage ? 'overflow-hidden h-full' : 'overflow-y-auto h-full pb-6 md:pb-20 pt-2 md:pt-0 scrollbar-hide'} flex justify-center min-h-0`}>
            <div className={`max-w-[1440px] mx-auto flex w-full h-full justify-center lg:justify-start ${isChatLikePage ? 'overflow-hidden' : ''}`}>
              <div className={`flex-1 max-w-4xl w-full ${isChatLikePage ? 'h-full flex flex-col overflow-hidden min-h-0' : ''}`}>
                <Outlet />
              </div>
              
              {/* Right Sidebar (Trends/Suggestions) */}
              {location.pathname === '/' && (
                <aside className="w-80 p-6 hidden lg:flex flex-col gap-5 overflow-y-auto shrink-0 sticky top-0 h-full">
                  <div className="glass p-5 rounded-3xl">
                    <h3 className="text-lg font-bold mb-4">Trending Now</h3>
                    <div className="flex flex-col gap-4">
                      {trending.length > 0 ? trending.map(post => (
                        <div key={post.id} className="cursor-pointer group" onClick={() => navigate('/explore')}>
                          <div className="text-[11px] opacity-50">Trending · Popular</div>
                          <div className="font-bold group-hover:text-indigo-400 transition-colors line-clamp-1">{post.text}</div>
                          <div className="text-[11px] opacity-50">{post.likes?.length || 0} likes</div>
                        </div>
                      )) : (
                        <div className="text-xs opacity-50 italic">Exploring for trends...</div>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TrendItem({ category, topic, posts }: { category: string, topic: string, posts: string }) {
  return (
    <div className="cursor-pointer group">
      <div className="text-[11px] opacity-50">{category} · Trending</div>
      <div className="font-bold group-hover:text-indigo-400 transition-colors">{topic}</div>
      <div className="text-[11px] opacity-50">{posts} posts</div>
    </div>
  );
}
