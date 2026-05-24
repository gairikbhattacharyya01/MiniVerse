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
import { Mail, Search, Edit3, Send, ChevronLeft, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
          <button className="p-2 glass-hover rounded-xl text-indigo-400"><Edit3 size={20} /></button>
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
                  <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                    {user.photoURL && <img src={user.photoURL} alt="" className="w-full h-full object-cover" />}
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
                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs">{user.name[0]}</div>
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
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
              {selectedUser.photoURL ? (
                <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold">{selectedUser.name[0]}</div>
              )}
            </div>
            <div>
              <div className="font-bold">{selectedUser.name}</div>
              <div className="text-[10px] opacity-50 uppercase tracking-widest font-black">Online</div>
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
            <button className="btn-primary px-8 py-3 rounded-full text-sm">New Message</button>
          </div>
        </div>
      )}
    </div>
  );
}
