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
import { auth, db, CLOUDINARY_CONFIG, createNotification, handleFirestoreError, OperationType, uploadMultipleToCloudinary } from '../lib/firebase';
import { Post as PostType, Comment as CommentType } from '../types';
import ShareButton from '../components/ShareButton';
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

      await addDoc(collection(db, 'posts'), {
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
            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden">
              {auth.currentUser?.photoURL ? (
                <img src={auth.currentUser.photoURL} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-600 text-sm font-bold uppercase text-white/50">
                  {auth.currentUser?.displayName?.[0] || 'U'}
                </div>
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

function PostItem({ post }: { post: PostType }) {
  const [liked, setLiked] = useState(post.likes?.includes(auth.currentUser?.uid || ''));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [reposted, setReposted] = useState(post.reposts?.includes(auth.currentUser?.uid || ''));
  const [repostsCount, setRepostsCount] = useState(post.reposts?.length || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showComments) {
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CommentType[];
        setComments(commentsData);
      });
      return unsubscribe;
    }
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!auth.currentUser) return;
    const postRef = doc(db, 'posts', post.id);
    if (liked) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
      await updateDoc(postRef, { likes: arrayRemove(auth.currentUser.uid) });
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
      await updateDoc(postRef, { likes: arrayUnion(auth.currentUser.uid) });
      
      // Notify owner
      if (post.userId !== auth.currentUser.uid) {
        await createNotification({
          type: 'like',
          fromUserId: auth.currentUser.uid,
          fromUserName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
          toUserId: post.userId,
          postId: post.id
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!auth.currentUser || post.userId !== auth.currentUser.uid) {
      console.warn("Delete attempt by non-owner or unauthenticated user", {
        currentUser: auth.currentUser?.uid,
        postOwner: post.userId
      });
      return;
    }
    
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 4000);
      return;
    }

    setShowDeleteConfirm(false);
    const postPath = `posts/${post.id}`;
    try {
      console.log("Attempting to delete post:", post.id);
      await deleteDoc(doc(db, 'posts', post.id));
      console.log("Post deleted successfully:", post.id);
    } catch (err: any) {
      console.error("Delete failed:", err);
      handleFirestoreError(err, OperationType.DELETE, postPath);
    }
  };

  const handleRepost = async () => {
    if (!auth.currentUser) return;
    const postRef = doc(db, 'posts', post.id);
    
    if (reposted) {
      setReposted(false);
      setRepostsCount(prev => prev - 1);
      await updateDoc(postRef, { reposts: arrayRemove(auth.currentUser.uid) });
    } else {
      setReposted(true);
      setRepostsCount(prev => prev + 1);
      await updateDoc(postRef, { reposts: arrayUnion(auth.currentUser.uid) });
      
      // Notify owner
      if (post.userId !== auth.currentUser.uid) {
        await createNotification({
          type: 'mention',
          fromUserId: auth.currentUser.uid,
          fromUserName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
          toUserId: post.userId,
          postId: post.id
        });
      }

      await addDoc(collection(db, 'posts'), {
        text: post.text,
        media: post.media || '',
        userId: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0],
        photoURL: auth.currentUser.photoURL,
        likes: [],
        reposts: [],
        isRepost: true,
        originalPostId: post.id,
        originalPostAuthor: post.displayName,
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
    }
  };

  const handleUpdate = async () => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, 'posts', post.id), { text: editText });
    setIsEditing(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: newComment,
        userId: auth.currentUser.uid,
        postId: post.id,
        postOwnerId: post.userId,
        displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0],
        photoURL: auth.currentUser.photoURL,
        createdAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'posts', post.id), {
        commentsCount: increment(1)
      });

      if (post.userId !== auth.currentUser.uid) {
        await createNotification({
          type: 'comment',
          fromUserId: auth.currentUser.uid,
          fromUserName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
          toUserId: post.userId,
          postId: post.id
        });
      }

      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass p-5 rounded-3xl transition-all hover:bg-white/10 group">
      <div className="flex gap-4">
        <Link to={`/profile/${post.userId}`} className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
            {post.photoURL ? (
              <img src={post.photoURL} alt={post.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-600 text-xs font-bold uppercase text-white/50">
                {post.displayName?.[0]}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post.userId}`} className="font-bold hover:underline">{post.displayName}</Link>
                <span className="text-xs opacity-50">· {post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) : 'just now'}</span>
              </div>
              {post.isRepost && (
                <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                  <Repeat size={10} />
                  <span>Reposted from {post.originalPostAuthor}</span>
                </div>
              )}
            </div>
            {auth.currentUser?.uid === post.userId && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-white/30 hover:text-indigo-400 p-1.5 rounded-lg glass-hover transition-colors"
                  title="Edit Post"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={handleDelete}
                  className={`chip font-bold transition-all ${
                    showDeleteConfirm 
                      ? 'text-red-500 bg-red-500/20 px-3 py-1 rounded-full text-xs animate-pulse font-bold' 
                      : 'text-red-500/70 hover:text-red-500'
                  }`}
                  title="Delete Post"
                >
                  {showDeleteConfirm ? 'Confirm Delete?' : '🗑'}
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea 
                className="w-full bg-white/5 border border-white/10 p-2 rounded-xl text-sm outline-none focus:border-indigo-500"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1.5 glass-hover rounded-lg"><X size={16}/></button>
                <button onClick={handleUpdate} className="p-1.5 bg-indigo-500 rounded-lg text-white"><Check size={16}/></button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[15px] opacity-90 leading-relaxed whitespace-pre-wrap">{post.text}</p>
          )}
          
          {post.mediaItems && post.mediaItems.length > 0 ? (
            <div className={`mt-3 grid gap-2 ${post.mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.mediaItems.map((item, idx) => (
                <div key={idx} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  {item.type === 'video' ? (
                    <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" />
                  ) : (
                    <img src={item.url} alt={`Post media ${idx}`} className="w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform duration-500" />
                  )}
                </div>
              ))}
            </div>
          ) : post.media && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <img src={post.media} alt="Post media" className="w-full h-auto max-h-[450px] object-cover" />
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-2 text-white/50 text-[13px]">
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 transition-colors ${showComments ? 'text-indigo-400' : 'hover:text-indigo-400'}`}
            >
              <MessageCircle size={18} />
              <span>{post.commentsCount || 0}</span>
              {showComments ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
            <button 
              onClick={handleRepost}
              className={`flex items-center gap-2 transition-colors ${reposted ? 'text-green-500 font-bold' : 'hover:text-green-400'}`}
            >
              <Repeat size={18} />
              <span>{repostsCount}</span>
            </button>
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors ${liked ? 'text-pink-500 font-bold' : 'hover:text-pink-500'}`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span>{likesCount}</span>
            </button>
            <ShareButton 
              postId={post.id} 
              postText={post.text} 
              userId={post.userId} 
              displayName={post.displayName} 
            />
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <form onSubmit={handleComment} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Post a comment..."
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm outline-none focus:border-indigo-500"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="btn-primary px-4 py-2 rounded-full text-xs font-bold text-white">Reply</button>
              </form>

              <div className="space-y-3">
                {comments.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    postId={post.id} 
                    postOwnerId={post.userId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, postId, postOwnerId }: { comment: CommentType, postId: string, postOwnerId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    // Only author or post owner can delete
    const isOwner = auth.currentUser?.uid === comment.userId || auth.currentUser?.uid === postOwnerId;
    if (!auth.currentUser || !isOwner) return;
    
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 4000);
      return;
    }

    setShowDeleteConfirm(false);
    const commentPath = `posts/${postId}/comments/${comment.id}`;
    try {
      console.log("Attempting to delete comment:", commentPath);
      await deleteDoc(doc(db, 'posts', postId, 'comments', comment.id));
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(-1)
      });
      console.log("Comment deleted successfully");
    } catch (err: any) {
      console.error("Comment delete failed:", err);
      handleFirestoreError(err, OperationType.DELETE, commentPath);
    }
  };

  const handleUpdate = async () => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, 'posts', postId, 'comments', comment.id), { text: editText });
    setIsEditing(false);
  };

  const canDelete = auth.currentUser?.uid === comment.userId || auth.currentUser?.uid === postOwnerId;

  return (
    <div className="flex gap-3 text-sm group/comment">
      <Link to={`/profile/${comment.userId}`} className="shrink-0">
        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
          {comment.photoURL ? (
            <img src={comment.photoURL} alt={comment.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-600 text-[10px] font-bold uppercase text-white/50">
              {comment.displayName?.[0]}
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${comment.userId}`} className="font-bold hover:underline">{comment.displayName}</Link>
            <span className="text-[10px] opacity-40">{comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate()) : 'just now'}</span>
          </div>
          {canDelete && (
            <div className="flex gap-2">
              {auth.currentUser?.uid === comment.userId && (
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-white/20 hover:text-indigo-400 p-1 rounded-md transition-colors"
                >
                  <Edit2 size={12} />
                </button>
              )}
              <button 
                onClick={handleDelete}
                className={`chip font-bold transition-all ${
                  showDeleteConfirm 
                    ? 'text-red-500 bg-red-500/20 px-2 py-0.5 rounded-full text-xs animate-pulse font-bold' 
                    : 'text-red-500/60 hover:text-red-500'
                }`}
                title="Delete comment"
              >
                {showDeleteConfirm ? 'Confirm?' : '🗑'}
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="mt-1 space-y-1">
            <input 
              className="w-full bg-white/5 border border-white/10 p-1.5 rounded-lg text-xs outline-none focus:border-indigo-500"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="flex justify-end gap-1">
              <button onClick={() => setIsEditing(false)} className="p-1 glass-hover rounded-md"><X size={12}/></button>
              <button onClick={handleUpdate} className="p-1 bg-indigo-500 rounded-md text-white"><Check size={12}/></button>
            </div>
          </div>
        ) : (
          <p className="opacity-80 leading-relaxed">{comment.text}</p>
        )}
      </div>
    </div>
  );
}
