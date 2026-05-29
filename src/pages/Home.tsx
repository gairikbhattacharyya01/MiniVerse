import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { auth, db, CLOUDINARY_CONFIG, createNotification, handleFirestoreError, OperationType, uploadMultipleToCloudinary, handleMentions } from '../lib/firebase';
import { Post as PostType, Comment as CommentType } from '../types';
import ShareButton from '../components/ShareButton';
import MentionText from '../components/MentionText';
import PostItem from '../components/PostItem';
import { 
  Image as ImageIcon, 
  MessageCircle,
  Repeat,
  Heart,
  Share,
  Trash2,
  Edit2,
  X,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [newPost, setNewPost] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostType[];
      setPosts(postsData);
    });
    return unsubscribe;
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && imageFiles.length === 0) return;

    setLoading(true);
    try {
      let mediaItems: {url: string, type: 'image' | 'video'}[] = [];
      if (imageFiles.length > 0) {
        mediaItems = await uploadMultipleToCloudinary(imageFiles);
      }

      const docRef = await addDoc(collection(db, 'posts'), {
        text: newPost,
        media: mediaItems.length > 0 ? mediaItems[0].url : '', // Backward compatibility
        mediaItems: mediaItems,
        userId: auth.currentUser?.uid,
        displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0],
        photoURL: auth.currentUser?.photoURL,
        likes: [],
        reposts: [],
        commentsCount: 0,
        createdAt: serverTimestamp()
      });

      if (auth.currentUser && newPost.trim()) {
        await handleMentions(
          newPost,
          auth.currentUser.uid,
          auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
          docRef.id
        );
      }

      setNewPost('');
      setImageFiles([]);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-8 w-full pb-24 mx-auto max-w-3xl">
      {/* Create Post */}
      <div className="glass p-4 md:p-5 rounded-2xl md:rounded-3xl border-indigo-400/30">
        <div className="flex gap-4">
          <Link to={`/profile/${auth.currentUser?.uid}`} className="shrink-0">
            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden relative flex items-center justify-center">
              <span className="text-sm font-bold uppercase text-white/50">{auth.currentUser?.displayName?.[0] || 'U'}</span>
              {auth.currentUser?.photoURL && (
                <img 
                  src={auth.currentUser.photoURL} 
                  alt="Me" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
          </Link>
          <div className="flex-1">
            <textarea
              placeholder="What's happening in your universe?"
              className="w-full bg-transparent border-none text-white text-lg outline-none resize-none min-h-[80px]"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
                {imageFiles.map((file, idx) => (
                  <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group">
                    {file.type.startsWith('video/') ? (
                      <video 
                        src={URL.createObjectURL(file)} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    )}
                    <button 
                      onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                    {file.type.startsWith('video/') && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/40 p-2 rounded-full">
                          <Check size={16} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
              <div className="flex gap-2 md:gap-4 text-indigo-400">
                <button 
                  className="hover:text-indigo-300 transition-colors cursor-pointer p-2 glass-hover rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  title="Add Media"
                >
                  <ImageIcon size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImageFiles(prev => [...prev, ...files]);
                  }}
                />
              </div>
              <button 
                onClick={handlePost}
                disabled={loading || (!newPost.trim() && imageFiles.length === 0)}
                className="btn-primary px-8 py-2 rounded-full text-white font-bold"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
