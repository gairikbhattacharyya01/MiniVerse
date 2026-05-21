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
  Hash
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, doc } from 'firebase/firestore';
import { Post as PostType, UserProfile } from '../types';
import Logo from './Logo';

interface LayoutProps {
  user: any;
}

export default function Layout({ user: authUser }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [trending, setTrending] = useState<PostType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

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
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      // Simple search query - ideally use a real search engine or lowercase name search
      const q = query(
        usersRef,
        where('name', '>=', val),
        where('name', '<=', val + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(d => d.data() as UserProfile));
    } catch (err) {
      console.error(err);
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
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen w-full mx-auto overflow-hidden relative bg-[#0f172a]">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-md z-40 sticky top-0">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="sm" showText={false} />
        </div>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-xl font-black tracking-tighter text-white text-glow">MiniVerse</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/notifications')} className="text-white/40 p-2 relative">
             <Bell size={20} />
             {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full"></span>
             )}
          </button>
          <button onClick={handleLogout} className="text-white/30 hover:text-red-400 p-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

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
      <main className="flex-1 flex overflow-hidden justify-center">
        <div className="flex-1 overflow-y-auto min-h-full pb-20 pt-2 md:pt-0 scrollbar-hide">
          <div className="max-w-[1440px] mx-auto flex w-full h-full justify-center lg:justify-start">
            <div className="flex-1 max-w-4xl w-full">
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
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 flex justify-around p-3 z-50">
        {navItems.map((item: any) => (
          item.external ? (
            <a
              key={item.name}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 relative"
            >
              <item.icon size={22} className={item.color || ''} />
            </a>
          ) : (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                p-2 relative transition-all
                ${isActive ? 'text-indigo-400' : 'text-white/50'}
              `}
            >
              <item.icon size={22} />
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        ))}
        <button onClick={handleLogout} className="p-2 text-red-400">
          <LogOut size={22} />
        </button>
      </nav>
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
