import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserPlus, 
  UserMinus, 
  Search,
  ExternalLink,
  Loader
} from 'lucide-react';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, createNotification } from '../lib/firebase';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userIds: string[];
  title: string; // "Followers" or "Following"
}

export default function ConnectionsModal({ isOpen, onClose, userIds, title }: ConnectionsModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

  // 1. Subscribe to currently logged-in user's following list in real-time
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentUserFollowing(data.following || []);
      }
    });
    return unsub;
  }, []);

  // 2. Fetch user profiles for the provided list of user IDs
  useEffect(() => {
    if (!isOpen || userIds.length === 0) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const fetchedUsers: UserProfile[] = [];
        
        // Firestore 'in' queries allow a maximum of 30 items
        const CHUNK_SIZE = 30;
        const chunks: string[][] = [];
        for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
          chunks.push(userIds.slice(i, i + CHUNK_SIZE));
        }

        const usersRef = collection(db, 'users');
        
        await Promise.all(
          chunks.map(async (chunk) => {
            const q = query(usersRef, where('uid', 'in', chunk));
            const snap = await getDocs(q);
            snap.forEach((docSnap) => {
              fetchedUsers.push(docSnap.data() as UserProfile);
            });
          })
        );

        // Sort users to match the original order of userIds if possible, or simple alphabetically
        fetchedUsers.sort((a, b) => a.name.localeCompare(b.name));
        setUsers(fetchedUsers);
      } catch (err) {
        console.error('Error fetching modal user profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userIds]);

  // Handle follow/unfollow toggle
  const handleFollowToggle = async (e: React.MouseEvent, targetUser: UserProfile) => {
    e.stopPropagation(); // Prevent modal item click routing
    if (!auth.currentUser) return;

    const targetUid = targetUser.uid;
    const isCurrentlyFollowing = currentUserFollowing.includes(targetUid);
    
    setFollowLoadingId(targetUid);
    
    const targetRef = doc(db, 'users', targetUid);
    const currentRef = doc(db, 'users', auth.currentUser.uid);

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await updateDoc(targetRef, { followers: arrayRemove(auth.currentUser.uid) });
        await updateDoc(currentRef, { following: arrayRemove(targetUid) });
      } else {
        // Follow
        await updateDoc(targetRef, { followers: arrayUnion(auth.currentUser.uid) });
        await updateDoc(currentRef, { following: arrayUnion(targetUid) });
        
        await createNotification({
          type: 'follow',
          fromUserId: auth.currentUser.uid,
          fromUserName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
          toUserId: targetUid
        });
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleUserClick = (uid: string) => {
    navigate(`/profile/${uid}`);
    onClose();
  };

  // Filter users display based on search box input
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          
          {/* Backdrop Blur Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Center Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg h-[550px] flex flex-col glass rounded-[35px] border border-white/12 shadow-2xl z-10 overflow-hidden"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-950/20">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
                <p className="text-[11px] font-bold text-indigo-400 capitalize tracking-widest mt-0.5">
                  {userIds.length} {userIds.length === 1 ? 'Signal' : 'Signals'} Connects
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-white/40 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Filter Search Input */}
            {userIds.length > 5 && (
              <div className="px-6 pt-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                    <Search size={15} />
                  </span>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Filter ${title.toLowerCase()}...`}
                    className="w-full bg-white/5 border border-white/8 rounded-full py-2.5 pl-11 pr-5 text-xs outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder-white/20"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-[10px] font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* List Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loading ? (
                <div className="h-full w-full flex flex-col items-center justify-center py-12 gap-3 text-white/40">
                  <Loader className="animate-spin text-indigo-400" size={30} />
                  <span className="text-xs font-semibold tracking-wide">Syncing cosmic coordinate profiles...</span>
                </div>
              ) : userIds.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center text-white/40 select-none">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <span className="text-2xl opacity-50">✦</span>
                  </div>
                  <h4 className="font-bold text-white/70 mb-1">Silence in Orbit</h4>
                  <p className="text-xs max-w-[280px] leading-relaxed">No adventurers found on these channels yet.</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center text-white/40 select-none">
                  <p className="text-xs font-medium italic">No results match your filter criteria.</p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isMe = user.uid === auth.currentUser?.uid;
                  const amFollowing = currentUserFollowing.includes(user.uid);
                  
                  return (
                    <div 
                      key={user.uid}
                      onClick={() => handleUserClick(user.uid)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200 cursor-pointer group"
                    >
                      
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-white/5 group-hover:border-indigo-500/50 transition-all shrink-0 relative flex items-center justify-center">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold uppercase text-white/70">
                              {user.name?.[0] || '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white/95 group-hover:text-indigo-300 transition-colors flex items-center gap-1.5 truncate">
                            <span>{user.name}</span>
                            {isMe && (
                              <span className="text-[9px] bg-indigo-500/30 text-indigo-200 font-bold px-1.5 py-0.1 rounded-full uppercase tracking-widest shrink-0">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-white/40 truncate">@{user.username}</p>
                          {user.bio && (
                            <p className="text-[10px] text-white/60 line-clamp-1 mt-0.5 leading-normal max-w-[220px]">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isMe && (
                          <button
                            onClick={(e) => handleFollowToggle(e, user)}
                            disabled={followLoadingId === user.uid}
                            className={`min-w-[100px] h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-40 select-none ${
                              amFollowing 
                                ? 'bg-white/5 border border-white/20 text-white hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 group/btn' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                          >
                            {followLoadingId === user.uid ? (
                              <Loader className="animate-spin" size={13} />
                            ) : amFollowing ? (
                              <>
                                <span className="group-hover/btn:hidden">Following</span>
                                <span className="hidden group-hover/btn:inline flex items-center gap-0.5">
                                  <UserMinus size={11} /> Unfollow
                                </span>
                              </>
                            ) : (
                              <>
                                <UserPlus size={11} />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white pb-0.5 pl-1">
                          <ExternalLink size={12} />
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
