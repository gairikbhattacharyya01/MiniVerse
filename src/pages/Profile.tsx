import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch,
  getDocs,
  collectionGroup,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db, uploadToCloudinary, createNotification, handleFirestoreError, OperationType } from '../lib/firebase';
import Logo from '../components/Logo';
import { UserProfile, Post as PostType } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  MapPin, 
  Calendar, 
  Edit3, 
  Heart,
  MessageCircle,
  Repeat,
  Share,
  Camera,
  X,
  Check,
  Mail,
  Trash2
} from 'lucide-react';

type TabType = 'posts' | 'reposts' | 'replies' | 'media' | 'likes';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [uploading, setUploading] = useState(false);

  const isOwnProfile = auth.currentUser?.uid === userId;

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
        setEditName(data.name || '');
        setEditBio(data.bio || '');
        setEditCity(data.city || '');
        setEditState(data.state || '');
        
        if (auth.currentUser) {
          setIsFollowing(data.followers?.includes(auth.currentUser.uid) || false);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let q;
    const postsRef = collection(db, 'posts');

    // Avoid complex queries that require manual indexes in Firestore
    switch (activeTab) {
      case 'posts':
        q = query(postsRef, where('userId', '==', userId));
        break;
      case 'reposts':
        q = query(postsRef, where('userId', '==', userId), where('isRepost', '==', true));
        break;
      case 'media':
        q = query(postsRef, where('userId', '==', userId));
        break;
      case 'likes':
        q = query(postsRef, where('likes', 'array-contains', userId));
        break;
      case 'replies':
        // Collection group query for comments by this user
        q = query(collectionGroup(db, 'comments'), where('userId', '==', userId));
        break;
      default:
        q = query(postsRef, where('userId', '==', userId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        _path: doc.ref.path,
        ...doc.data()
      }));

      // Client-side filtering
      if (activeTab === 'posts') {
        data = data.filter((item: any) => !item.isRepost);
      } else if (activeTab === 'media') {
        data = data.filter((item: any) => item.media && item.media !== '');
      }
      
      // Client-side sorting
      data.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
      
      setPosts(data);
    }, (error) => {
      console.error("Tab query error:", error);
      setPosts([]);
    });

    return unsubscribe;
  }, [userId, activeTab]);

  const handleFollow = async () => {
    if (!auth.currentUser || !userId) return;
    
    const userToFollowRef = doc(db, 'users', userId);
    const currentUserRef = doc(db, 'users', auth.currentUser.uid);

    if (isFollowing) {
      setIsFollowing(false);
      await updateDoc(userToFollowRef, { followers: arrayRemove(auth.currentUser.uid) });
      await updateDoc(currentUserRef, { following: arrayRemove(userId) });
    } else {
      setIsFollowing(true);
      await updateDoc(userToFollowRef, { followers: arrayUnion(auth.currentUser.uid) });
      await updateDoc(currentUserRef, { following: arrayUnion(userId) });
      
      await createNotification({
        type: 'follow',
        fromUserId: auth.currentUser.uid,
        fromUserName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
        toUserId: userId
      });
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !userId) return;
    
    setUploading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        name: editName,
        bio: editBio,
        city: editCity,
        state: editState
      });

      if (isOwnProfile) {
        await updateProfile(auth.currentUser, { displayName: editName });
      }

      const postsToUpdate = await getDocs(query(collection(db, 'posts'), where('userId', '==', userId)));
      const batch = writeBatch(db);
      postsToUpdate.docs.forEach(d => {
        batch.update(d.ref, { displayName: editName });
      });
      await batch.commit();

      setProfile(prev => prev ? { ...prev, name: editName, bio: editBio, city: editCity, state: editState } : null);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const { url } = await uploadToCloudinary(file);
      await updateDoc(doc(db, 'users', userId), { coverURL: url });
      setProfile(prev => prev ? { ...prev, coverURL: url } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const { url } = await uploadToCloudinary(file);
      await updateDoc(doc(db, 'users', userId), { photoURL: url });
      
      if (isOwnProfile && auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
      }

      const postsToUpdate = await getDocs(query(collection(db, 'posts'), where('userId', '==', userId)));
      const batch = writeBatch(db);
      postsToUpdate.docs.forEach(d => {
        batch.update(d.ref, { photoURL: url });
      });
      await batch.commit();

      setProfile(prev => prev ? { ...prev, photoURL: url } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (post: any) => {
    const isComment = activeTab === 'replies';
    const identifier = post._path || `posts/${post.id}`;
    
    if (confirmDeleteId !== identifier) {
      setConfirmDeleteId(identifier);
      setTimeout(() => {
        setConfirmDeleteId(current => current === identifier ? null : current);
      }, 4000);
      return;
    }

    setConfirmDeleteId(null);
    const path = identifier;
    try {
      console.log("Profile: Attempting to delete doc at path:", path, { isComment });
      await deleteDoc(doc(db, path));
      console.log("Profile: Doc deleted successfully");
      
      // If it's a comment, find the parent post ID from the path and decrement commentsCount
      if (isComment && path.includes('/comments/')) {
        const pathParts = path.split('/');
        const parentPostId = pathParts[1];
        console.log("Profile: Decrementing commentsCount for post:", parentPostId);
        await updateDoc(doc(db, 'posts', parentPostId), {
          commentsCount: increment(-1)
        });
      }
    } catch (err: any) {
      console.error("Profile: Delete failed:", err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    navigate('/messages', { state: { startChatWith: profile } });
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-20">
      <h2 className="text-2xl font-bold text-white/50">User not found</h2>
      <button onClick={() => navigate('/')} className="btn-primary px-6 py-2 rounded-xl">Go Home</button>
    </div>
  );

  return (
    <div className="flex-1 w-full pb-20 mx-auto max-w-3xl">
      {/* Banner */}
      <div className="h-48 md:h-52 bg-slate-800 relative overflow-hidden group">
        {profile.coverURL ? (
          <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <Logo size="lg" showText={false} />
          </div>
        )}
        {isOwnProfile && (
          <label className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
            <div className="glass p-3 rounded-full flex items-center gap-2">
              <Camera size={24} className="text-white" />
              <span className="text-white text-xs font-bold uppercase tracking-widest hidden md:block">Change Cover</span>
            </div>
            <input type="file" className="hidden" onChange={handleCoverChange} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Profile Section */}
      <div className="px-4 pb-4 border-b border-white/10 relative">
        <div className="flex justify-between items-start mb-6">
          {/* Avatar - Twitter style overlapping */}
          <div className="relative -mt-16 md:-mt-20 ml-2 md:ml-4 z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-slate-900 border-4 border-[#0f172a] relative group/photo">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-slate-700 uppercase">
                  {profile.name?.[0]}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-[#0f172a]/70 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {isOwnProfile && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={28} className="text-white" />
                  <input type="file" className="hidden" onChange={handlePhotoChange} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2 border rounded-full font-bold transition-all ${
                  isEditing ? 'border-red-500/50 text-red-500 hover:bg-red-500/5' : 'border-white/20 hover:bg-white/10'
                }`}
              >
                {isEditing ? 'Cancel' : 'Edit profile'}
              </button>
            ) : (
              <>
                <button 
                  onClick={handleMessage}
                  className="p-2.5 border border-white/20 rounded-full hover:bg-white/10 transition-all"
                  title="Message"
                >
                  <Mail size={20} />
                </button>
                <button 
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    isFollowing ? 'border border-white/20 hover:text-red-500 hover:border-red-500' : 'bg-white text-black hover:bg-slate-200'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-2">
          {isEditing ? (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white/30 uppercase ml-1">Display Name</label>
                <input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 transition-all font-medium text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white/30 uppercase ml-1">Bio</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-white/30 uppercase ml-1">City</label>
                  <input value={editCity} onChange={(e)=>setEditCity(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-white/30 uppercase ml-1">State</label>
                  <input value={editState} onChange={(e)=>setEditState(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 text-white" />
                </div>
              </div>
              <button 
                onClick={handleSave} 
                disabled={uploading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 font-bold py-3 rounded-2xl transition-all disabled:opacity-50 text-white"
              >
                {uploading ? 'Updating...' : 'Save Universe'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                <p className="text-white/50">@{profile.username}</p>
              </div>
              
              {profile.bio && <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-white/90">{profile.bio}</p>}

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] text-white/50 font-medium">
                {(profile.city || profile.state) && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{profile.city}{profile.city && profile.state ? ', ' : ''}{profile.state}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Joined {profile.createdAt ? format(profile.createdAt.toDate(), 'MMMM yyyy') : 'recently'}</span>
                </div>
              </div>

              <div className="flex gap-4 text-[14px]">
                <div className="flex gap-1 hover:underline cursor-pointer group">
                  <span className="font-bold text-white">{profile.following?.length || 0}</span>
                  <span className="text-white/50">Following</span>
                </div>
                <div className="flex gap-1 hover:underline cursor-pointer group">
                  <span className="font-bold text-white">{profile.followers?.length || 0}</span>
                  <span className="text-white/50">Followers</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-[#0f172a] sticky top-0 z-10 overflow-x-auto scroller-hidden">
        {(['posts', 'reposts', 'replies', 'media', 'likes'] as TabType[]).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] py-4 text-sm font-bold capitalize transition-colors whitespace-nowrap
              ${activeTab === tab ? 'border-b-2 border-indigo-500 text-white' : 'text-white/50 hover:bg-white/5'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="p-6 space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="glass p-5 rounded-3xl group transition-all hover:bg-white/5">
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{post.displayName}</span>
                        <span className="text-xs opacity-50">· {post.createdAt ? (post.createdAt.toDate ? formatDistanceToNow(post.createdAt.toDate()) : 'just now') : 'just now'}</span>
                      </div>
                      {post.isRepost && (
                        <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                          <Repeat size={10} />
                          <span>Reposted from {post.originalPostAuthor}</span>
                        </div>
                      )}
                    </div>
                    {(post.userId === auth.currentUser?.uid || post.postOwnerId === auth.currentUser?.uid) && (
                      <button 
                        onClick={() => handleDelete(post)}
                        className={`chip font-bold transition-all ${
                          confirmDeleteId === (post._path || `posts/${post.id}`) 
                            ? 'text-red-500 bg-red-500/20 px-3 py-1 rounded-full text-xs animate-pulse font-bold' 
                            : 'text-red-500/60 hover:text-red-500'
                        }`}
                        title="Delete"
                      >
                        {confirmDeleteId === (post._path || `posts/${post.id}`) ? 'Confirm Delete?' : '🗑'}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[15px] opacity-90 leading-relaxed whitespace-pre-wrap">{post.text || post.comment}</p>
                  {post.mediaItems && post.mediaItems.length > 0 ? (
                    <div className={`mt-3 grid gap-2 ${post.mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {post.mediaItems.map((item: any, idx: number) => (
                        <div key={idx} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                          {item.type === 'video' ? (
                            <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" />
                          ) : (
                            <img src={item.url} alt="content" className="w-full h-auto max-h-[300px] object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : post.media && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                      <img src={post.media} alt="content" className="w-full h-auto max-h-[450px] object-cover" />
                    </div>
                  )}
                  {activeTab !== 'replies' && (
                    <div className="flex justify-between items-center mt-4 text-white/40">
                      <button className="hover:text-indigo-400 group/icon flex items-center gap-2 transition-colors">
                        <MessageCircle size={18} />
                        <span className="text-xs">{post.commentsCount || 0}</span>
                      </button>
                      <button className={`flex items-center gap-2 transition-colors ${post.reposts?.includes(auth.currentUser?.uid || '') ? 'text-green-400 font-bold' : 'hover:text-green-400'}`}>
                        <Repeat size={18} />
                        <span className="text-xs">{post.reposts?.length || 0}</span>
                      </button>
                      <button className={`flex items-center gap-2 transition-colors ${post.likes?.includes(auth.currentUser?.uid || '') ? 'text-pink-500 font-bold' : 'hover:text-pink-500'}`}>
                        <Heart size={18} fill={post.likes?.includes(auth.currentUser?.uid || '') ? 'currentColor' : 'none'} />
                        <span className="text-xs">{post.likes?.length || 0}</span>
                      </button>
                      <button className="hover:text-indigo-400 transition-colors"><Share size={18} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-40 italic flex flex-col items-center gap-3">
            <span className="text-4xl text-white/10 font-black uppercase tracking-tighter">Empty Space</span>
            <p>No signals found in this frequency.</p>
            {activeTab === 'replies' && <p className="text-xs text-white/20 not-italic">(Check if you have any interactions yet)</p>}
          </div>
        )}
      </div>
    </div>
  );
}

