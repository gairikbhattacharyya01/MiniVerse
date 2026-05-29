import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs,
  limit,
  or,
  and,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Message as MessageType, UserProfile } from '../types';
import { Mail, Search, Edit3, Send, ChevronLeft, User, X, Sparkles, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import MessageBubble from '../components/MessageBubble';

export default function Messages() {
  const location = useLocation();
  const [conversations, setConversations] = useState<{user: UserProfile, lastMessage?: MessageType}[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeSelectedUser, setActiveSelectedUser] = useState<UserProfile | null>(null);
  const [tick, setTick] = useState(0);

  // New Message Modal states
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<UserProfile[]>([]);
  const [modalSearchLoading, setModalSearchLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);

  // Fetch users to suggest as initial chat recommendations
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchSuggestions = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(query(usersRef, limit(100)));
        const all = snap.docs
          .map(d => d.data() as UserProfile)
          .filter(u => u.uid !== auth.currentUser?.uid);
        setSuggestedUsers(all.slice(0, 15));
      } catch (err) {
        console.error("Error loading chat suggestions:", err);
      }
    };
    fetchSuggestions();
  }, []);

  const handleModalSearch = async (val: string) => {
    setModalSearchTerm(val);
    if (val.trim().length < 2) {
      setModalSearchResults([]);
      return;
    }
    setModalSearchLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(query(usersRef, limit(300)));
      const allUsers = snap.docs.map(d => d.data() as UserProfile);
      
      const searchLower = val.toLowerCase().trim();
      const filtered = allUsers.filter(u => {
        if (u.uid === auth.currentUser?.uid) return false;
        
        const nameMatch = u.name?.toLowerCase().includes(searchLower);
        const usernameMatch = u.username?.toLowerCase().includes(searchLower);
        const emailMatch = u.email?.toLowerCase().includes(searchLower);
        return nameMatch || usernameMatch || emailMatch;
      });
      setModalSearchResults(filtered.slice(0, 15));
    } catch (err) {
      console.error("Modal search error:", err);
    } finally {
      setModalSearchLoading(false);
    }
  };

  // Periodic visual updates for status durations
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync selected user profile and subscribe for live status updates
  useEffect(() => {
    if (!selectedUser) {
      setActiveSelectedUser(null);
      return;
    }
    setActiveSelectedUser(selectedUser);
    const unsubscribe = onSnapshot(doc(db, 'users', selectedUser.uid), (snap) => {
      if (snap.exists()) {
        setActiveSelectedUser(snap.data() as UserProfile);
      }
    });
    return unsubscribe;
  }, [selectedUser]);

  const getUserOnlineStatus = (profile: UserProfile | null): { isOnline: boolean; label: string } => {
    if (!profile) return { isOnline: false, label: 'Offline' };
    const lastActiveVal = profile.lastActive;
    if (!lastActiveVal) return { isOnline: false, label: 'Offline' };

    let lastActiveDate: Date;
    if (lastActiveVal.toDate) {
      lastActiveDate = lastActiveVal.toDate();
    } else if (lastActiveVal instanceof Date) {
      lastActiveDate = lastActiveVal;
    } else if (typeof lastActiveVal === 'number') {
      lastActiveDate = new Date(lastActiveVal);
    } else if (lastActiveVal.seconds) {
      lastActiveDate = new Date(lastActiveVal.seconds * 1000);
    } else {
      lastActiveDate = new Date(lastActiveVal);
    }

    const diffSeconds = (Date.now() - lastActiveDate.getTime()) / 1000;
    if (diffSeconds < 120) { // Active within last 2 minutes
      return { isOnline: true, label: 'Online' };
    } else if (diffSeconds < 3600) {
      const mins = Math.floor(diffSeconds / 60);
      return { isOnline: false, label: `Active ${mins}m ago` };
    } else if (diffSeconds < 86400) {
      const hrs = Math.floor(diffSeconds / 3600);
      return { isOnline: false, label: `Active ${hrs}h ago` };
    } else {
      const days = Math.floor(diffSeconds / 86400);
      return { isOnline: false, label: `Active ${days}d ago` };
    }
  };

  useEffect(() => {
    if (location.state?.startChatWith) {
      setSelectedUser(location.state.startChatWith);
    }
  }, [location]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', auth.currentUser.uid),
        where('receiverId', '==', auth.currentUser.uid)
      )
      // Removed orderBy to avoid index requirement
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MessageType[];
      
      // Sort in-memory
      msgs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

      const userIds = new Set<string>();
      msgs.forEach(m => {
        if (m.senderId !== auth.currentUser?.uid) userIds.add(m.senderId);
        if (m.receiverId !== auth.currentUser?.uid) userIds.add(m.receiverId);
      });

      // Also add the selected user if they are from the state
      if (location.state?.startChatWith) {
        userIds.add(location.state.startChatWith.uid);
      }

      const convosMap = new Map<string, {user: UserProfile, lastMessage?: MessageType}>();
      
      const fetchUserData = async (uid: string) => {
        if (convosMap.has(uid)) return;
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data() as UserProfile;
          const lastMsg = msgs.find(m => m.senderId === uid || m.receiverId === uid);
          convosMap.set(uid, { user: userData, lastMessage: lastMsg });
        }
      };

      await Promise.all(Array.from(userIds).map(fetchUserData));
      
      setConversations(Array.from(convosMap.values()).sort((a, b) => {
        const aTime = a.lastMessage?.createdAt?.toMillis() || 0;
        const bTime = b.lastMessage?.createdAt?.toMillis() || 0;
        return bTime - aTime;
      }));
      setLoading(false);
    });

    return unsubscribe;
  }, [location.state?.startChatWith]);

  useEffect(() => {
    if (!selectedUser || !auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      or(
        and(where('senderId', '==', auth.currentUser.uid), where('receiverId', '==', selectedUser.uid)),
        and(where('senderId', '==', selectedUser.uid), where('receiverId', '==', auth.currentUser.uid))
      )
      // Removed orderBy to avoid index requirement
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MessageType[];
      setMessages(msgs.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)));
    });

    return unsubscribe;
  }, [selectedUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(query(usersRef, limit(300)));
      const allUsers = snap.docs.map(d => d.data() as UserProfile);
      
      const searchLower = val.toLowerCase().trim();
      const filtered = allUsers.filter(u => {
        // Exclude current user from candidate search results if they are chatting with themselves
        if (u.uid === auth.currentUser?.uid) return false;
        
        const nameMatch = u.name?.toLowerCase().includes(searchLower);
        const usernameMatch = u.username?.toLowerCase().includes(searchLower);
        const emailMatch = u.email?.toLowerCase().includes(searchLower);
        return nameMatch || usernameMatch || emailMatch;
      });
      
      setSearchResults(filtered.slice(0, 8));
    } catch (err) {
      console.error("Search error in Messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !auth.currentUser) return;

    const text = newMessage;
    setNewMessage('');
    await addDoc(collection(db, 'messages'), {
      text,
      senderId: auth.currentUser.uid,
      receiverId: selectedUser.uid,
      createdAt: serverTimestamp()
    });
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        text: newText,
        edited: true
      });
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Conversations List */}
      <div className={`w-full md:w-80 border-r border-white/10 flex flex-col shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter">Messages</h1>
          <button 
            onClick={() => setIsNewMessageModalOpen(true)}
            className="p-2 glass-hover rounded-xl text-indigo-400"
            title="New Message"
          >
            <Edit3 size={20} />
          </button>
        </div>
        
        <div className="px-6 mb-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Search people"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-6 right-6 z-10 glass mt-1 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
              {searchResults.map(user => (
                <div 
                  key={user.uid}
                  onClick={() => { setSelectedUser(user); setSearchResults([]); setSearchTerm(''); }}
                  className="p-3 glass-hover flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0 relative flex items-center justify-center">
                    <span className="text-xs font-bold uppercase text-white/50">{user.name?.[0] || '?'}</span>
                    {user.photoURL && (
                      <img 
                        src={user.photoURL} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    {getUserOnlineStatus(user).isOnline && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{user.name}</div>
                    <div className="text-[10px] opacity-50 truncate">@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : conversations.length > 0 ? (
            conversations.map(({ user, lastMessage }) => (
              <div 
                key={user.uid}
                onClick={() => setSelectedUser(user)}
                className={`flex gap-3 p-4 px-6 cursor-pointer transition-colors glass-hover ${selectedUser?.uid === user.uid ? 'bg-white/5' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden shrink-0 relative flex items-center justify-center">
                  <span className="text-xs font-bold uppercase text-white/50">{user.name[0]}</span>
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  {getUserOnlineStatus(user).isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e293b]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-sm truncate">{user.name}</span>
                    {lastMessage && <span className="text-[10px] opacity-40">{formatDistanceToNow(lastMessage.createdAt?.toDate() || new Date())}</span>}
                  </div>
                  <p className="text-xs opacity-50 truncate">
                    {lastMessage?.senderId === auth.currentUser?.uid ? 'You: ' : ''}{lastMessage?.text || 'No messages yet'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center opacity-40 text-sm italic">You don't have any messages yet.</div>
          )}
        </div>
      </div>

      {/* Chat View */}
      {selectedUser ? (
        <div className={`flex-1 flex flex-col bg-[#0f172a]/50 ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
          <header className="p-4 px-6 border-b border-white/10 flex items-center gap-4">
            <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 rounded-full glass-hover"><ChevronLeft size={20}/></button>
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 relative flex items-center justify-center">
              <span className="font-bold text-sm text-white/50">{activeSelectedUser?.name?.[0] || selectedUser.name[0]}</span>
              {(activeSelectedUser?.photoURL || selectedUser.photoURL) && (
                <img 
                  src={activeSelectedUser?.photoURL || selectedUser.photoURL} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {getUserOnlineStatus(activeSelectedUser || selectedUser).isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-900" />
              )}
            </div>
            <div>
              <div className="font-bold">{activeSelectedUser?.name || selectedUser.name}</div>
              {(() => {
                const status = getUserOnlineStatus(activeSelectedUser || selectedUser);
                return (
                  <div className={`text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 ${status.isOnline ? 'text-green-400' : 'opacity-40 text-slate-300'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
                    {status.label}
                  </div>
                );
              })()}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => {
              const isMe = m.senderId === auth.currentUser?.uid;
              return (
                <MessageBubble 
                  key={m.id} 
                  message={m} 
                  isMe={isMe} 
                  onEdit={handleEditMessage} 
                  onDelete={handleDeleteMessage} 
                />
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6">
            <div className="glass p-2 px-4 rounded-3xl flex items-center gap-2 group transition-all focus-within:border-indigo-400/50">
              <input 
                className="flex-1 bg-transparent border-none outline-none py-3 text-sm placeholder:text-white/20"
                placeholder="Write a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button disabled={!newMessage.trim()} className="p-3 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-500 disabled:opacity-50 transition-all">
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center p-12 text-center bg-[#0f172a]/20">
          <div className="max-w-xs space-y-4">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto text-indigo-400">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-black">Select a conversation</h2>
            <p className="text-sm opacity-50">Choose from your existing chats or start a new one to talk privately in the MiniVerse.</p>
            <button 
              onClick={() => setIsNewMessageModalOpen(true)}
              className="btn-primary px-8 py-3 rounded-full text-sm font-bold tracking-wide cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              New Message
            </button>
          </div>
        </div>
      )}

      {/* New Message Selection Modal */}
      <AnimatePresence>
        {isNewMessageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsNewMessageModalOpen(false);
                setModalSearchTerm('');
                setModalSearchResults([]);
              }}
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh] z-10"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-400" />
                    New Message
                  </h3>
                  <p className="text-[10px] text-slate-400">Search handle, name or select recommendations below</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsNewMessageModalOpen(false);
                    setModalSearchTerm('');
                    setModalSearchResults([]);
                  }}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Box */}
              <div className="p-4 border-b border-white/5 bg-[#0f172a]/50">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30 text-white" size={16} />
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-slate-400"
                    placeholder="Search name, username, or email"
                    value={modalSearchTerm}
                    onChange={(e) => handleModalSearch(e.target.value)}
                    autoFocus
                  />
                  {modalSearchTerm && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setModalSearchTerm('');
                        setModalSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 hover:bg-white/10 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results / suggestions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {modalSearchLoading ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-slate-400 text-xs">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching database...</span>
                  </div>
                ) : modalSearchTerm.trim().length >= 2 ? (
                  modalSearchResults.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-indigo-400 px-2 mb-2 uppercase tracking-wider">Search Results</div>
                      {modalSearchResults.map(user => (
                        <div 
                          key={user.uid}
                          onClick={() => {
                            setSelectedUser(user);
                            setIsNewMessageModalOpen(false);
                            setModalSearchTerm('');
                            setModalSearchResults([]);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer transition-all"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden relative flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold uppercase text-white/50">{user.name?.[0] || '?'}</span>
                            {user.photoURL && (
                              <img 
                                src={user.photoURL} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            {getUserOnlineStatus(user).isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-900" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-white truncate">{user.name}</div>
                            <div className="text-xs text-slate-400 truncate">@{user.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 select-none">
                      <AlertCircle className="mx-auto text-slate-500 mb-2" size={24} />
                      <p className="text-sm font-bold">No results found</p>
                      <p className="text-xs opacity-50 mt-1">Try another name or username search.</p>
                    </div>
                  )
                ) : (
                  // Suggested users lists
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-indigo-400 px-2 mb-2 uppercase tracking-wider">Suggested Contacts</div>
                    {suggestedUsers.length > 0 ? (
                      suggestedUsers.map(user => (
                        <div 
                          key={user.uid}
                          onClick={() => {
                            setSelectedUser(user);
                            setIsNewMessageModalOpen(false);
                            setModalSearchTerm('');
                            setModalSearchResults([]);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer transition-all"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden relative flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold uppercase text-white/50">{user.name?.[0] || '?'}</span>
                            {user.photoURL && (
                              <img 
                                src={user.photoURL} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            {getUserOnlineStatus(user).isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-900" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-white truncate">{user.name}</div>
                            <div className="text-xs text-slate-400 truncate">@{user.username}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-500 text-xs italic">
                        No suggestible users found. Use search above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
