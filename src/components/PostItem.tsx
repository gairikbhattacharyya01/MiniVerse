import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  deleteDoc,
  increment,
  addDoc
} from 'firebase/firestore';
import { auth, db, createNotification, handleFirestoreError, OperationType, handleMentions } from '../lib/firebase';
import { Post as PostType, Comment as CommentType } from '../types';
import ShareButton from './ShareButton';
import MentionText from './MentionText';
import { 
  MessageCircle,
  Repeat,
  Heart,
  Edit2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostItemProps {
  post: PostType;
}

export default function PostItem({ post }: PostItemProps) {
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

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const allMedia = post.mediaItems && post.mediaItems.length > 0
    ? post.mediaItems
    : post.media
      ? [{ url: post.media, type: 'image' as const }]
      : [];

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft' && allMedia.length > 1) {
        setActiveMediaIndex(prev => (prev - 1 + allMedia.length) % allMedia.length);
      } else if (e.key === 'ArrowRight' && allMedia.length > 1) {
        setActiveMediaIndex(prev => (prev + 1) % allMedia.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, allMedia.length]);

  useEffect(() => {
    setLiked(post.likes?.includes(auth.currentUser?.uid || ''));
    setLikesCount(post.likes?.length || 0);
    setReposted(post.reposts?.includes(auth.currentUser?.uid || ''));
    setRepostsCount(post.reposts?.length || 0);
    setEditText(post.text);
  }, [post, auth.currentUser?.uid]);

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

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editText.trim()) return;
    await updateDoc(doc(db, 'posts', post.id), { text: editText });
    if (auth.currentUser) {
      await handleMentions(
        editText,
        auth.currentUser.uid,
        auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
        post.id
      );
    }
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

      // Handle mentions in comment text
      await handleMentions(
        newComment,
        auth.currentUser.uid,
        auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
        post.id
      );

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
    <div 
      onClick={() => navigate(`/profile/${post.userId}`)}
      className="glass p-5 rounded-3xl transition-all hover:bg-white/10 group text-white cursor-pointer"
    >
      <div className="flex gap-4">
        <Link to={`/profile/${post.userId}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden relative flex items-center justify-center">
            <span className="text-xs font-bold uppercase text-white/50">{post.displayName?.[0] || 'U'}</span>
            {post.photoURL && (
              <img 
                src={post.photoURL} 
                alt={post.displayName} 
                className="absolute inset-0 w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post.userId}`} className="font-bold hover:underline" onClick={(e) => e.stopPropagation()}>
                  {post.displayName}
                </Link>
                <span className="text-xs opacity-50">
                  · {post.createdAt ? (post.createdAt.toDate ? formatDistanceToNow(post.createdAt.toDate()) : 'just now') : 'just now'}
                </span>
              </div>
              {post.isRepost && (
                <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                  <Repeat size={10} />
                  <span>Reposted from {post.originalPostAuthor}</span>
                </div>
              )}
            </div>
            {auth.currentUser?.uid === post.userId && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
            <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea 
                className="w-full bg-white/5 border border-white/10 p-2 rounded-xl text-sm outline-none focus:border-indigo-500 text-white"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1.5 glass-hover rounded-lg"><X size={16}/></button>
                <button onClick={handleUpdate} className="p-1.5 bg-indigo-500 rounded-lg text-white"><Check size={16}/></button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[15px] opacity-90 leading-relaxed whitespace-pre-wrap">
              <MentionText text={post.text} />
            </p>
          )}
          
          {post.mediaItems && post.mediaItems.length > 0 ? (
            <div className={`mt-3 grid gap-2 ${post.mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.mediaItems.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex(idx);
                    setLightboxOpen(true);
                  }}
                  className="relative group/media overflow-hidden rounded-2xl border border-white/10 bg-slate-900 cursor-zoom-in min-h-[150px] flex items-center justify-center"
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-auto max-h-[300px] object-cover pointer-events-none" />
                  ) : (
                    <img src={item.url} alt={`Post media ${idx}`} className="w-full h-auto max-h-[300px] object-cover group-hover/media:scale-105 transition-transform duration-500" />
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <div className="p-2.5 bg-black/60 rounded-full text-white backdrop-blur-sm border border-white/10 scale-90 group-hover/media:scale-100 transition-transform">
                      <Maximize2 size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : post.media && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex(0);
                setLightboxOpen(true);
              }}
              className="relative group/media mt-3 overflow-hidden rounded-2xl border border-white/10 cursor-zoom-in"
            >
              <img src={post.media} alt="Post media" className="w-full h-auto max-h-[450px] object-cover group-hover/media:scale-105 transition-transform duration-500" />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center z-10">
                <div className="p-2.5 bg-black/60 rounded-full text-white backdrop-blur-sm border border-white/10 scale-90 group-hover/media:scale-100 transition-transform">
                  <Maximize2 size={18} />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-2 text-white/50 text-[13px]" onClick={(e) => e.stopPropagation()}>
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
              photoURL={post.photoURL}
            />
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleComment} className="flex gap-2 w-full">
                <input 
                  type="text"
                  placeholder="Post a comment..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm outline-none focus:border-indigo-500 text-white placeholder-white/30"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="btn-primary px-4 py-2 rounded-full text-xs font-bold text-white shrink-0">Reply</button>
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

      {createPortal(
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex flex-col justify-between bg-slate-950/98 backdrop-blur-lg select-none text-white overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
            >
              {/* Header */}
              <header className="w-full bg-gradient-to-b from-slate-950/80 to-transparent p-6 flex items-center justify-between z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0 relative flex items-center justify-center">
                    <span className="text-xs font-bold uppercase text-white/50">{post.displayName?.[0] || 'U'}</span>
                    {post.photoURL && (
                      <img 
                        src={post.photoURL} 
                        alt={post.displayName} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold tracking-tight text-white">{post.displayName}</span>
                    {allMedia.length > 1 && (
                      <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        Item {activeMediaIndex + 1} of {allMedia.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={allMedia[activeMediaIndex]?.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()} 
                    className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-all duration-200"
                    title="Open original in new tab"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxOpen(false);
                    }}
                    className="p-2.5 bg-indigo-500 hover:bg-indigo-600 hover:scale-105 active:scale-95 text-white rounded-full transition-all duration-200 shadow-lg shadow-indigo-500/20"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              {/* Main Viewport */}
              <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
                {allMedia.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex(prev => (prev - 1 + allMedia.length) % allMedia.length);
                    }}
                    className="absolute left-4 md:left-8 z-10 p-3.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full text-white cursor-pointer transition-all duration-200 backdrop-blur-sm shadow-2xl hover:border-white/20"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMediaIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-full max-h-[70vh] md:max-h-[78vh] flex items-center justify-center p-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allMedia[activeMediaIndex]?.type === 'video' ? (
                      <video 
                        src={allMedia[activeMediaIndex]?.url} 
                        controls 
                        autoPlay 
                        className="max-w-full max-h-[70vh] md:max-h-[78vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                      />
                    ) : (
                      <img 
                        src={allMedia[activeMediaIndex]?.url} 
                        alt="Fullscreen media" 
                        className="max-w-full max-h-[70vh] md:max-h-[78vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-text"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {allMedia.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex(prev => (prev + 1) % allMedia.length);
                    }}
                    className="absolute right-4 md:right-8 z-10 p-3.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full text-white cursor-pointer transition-all duration-200 backdrop-blur-sm shadow-2xl hover:border-white/20"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>

              {/* Bottom Caption & Thumbnail Reels */}
              <div className="w-full bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-6 mt-auto flex flex-col items-center gap-4 text-center select-text shrink-0" onClick={(e) => e.stopPropagation()}>
                {post.text && (
                  <div className="max-w-xl text-center">
                    <p className="text-sm md:text-base text-slate-200 line-clamp-3 leading-relaxed drop-shadow-md">
                      {post.text}
                    </p>
                  </div>
                )}
                {allMedia.length > 1 && (
                  <div className="flex gap-2.5 min-h-[50px] items-center justify-center max-w-full overflow-x-auto py-2 px-4 scrollbar-hide">
                    {allMedia.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative h-11 w-11 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                          idx === activeMediaIndex 
                            ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/30' 
                            : 'border-white/10 hover:border-white/30 scale-100 opacity-50 hover:opacity-100'
                        }`}
                      >
                        {item.type === 'video' ? (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">
                            VIDEO
                          </div>
                        ) : (
                          <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function CommentItem({ comment, postId, postOwnerId }: { comment: CommentType, postId: string, postOwnerId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
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
    if (auth.currentUser) {
      await handleMentions(
        editText,
        auth.currentUser.uid,
        auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone',
        postId
      );
    }
    setIsEditing(false);
  };

  const canDelete = auth.currentUser?.uid === comment.userId || auth.currentUser?.uid === postOwnerId;

  return (
    <div className="flex gap-3 text-sm group/comment">
      <Link to={`/profile/${comment.userId}`} className="shrink-0">
        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden relative flex items-center justify-center">
          <span className="text-[10px] font-bold uppercase text-white/50">{comment.displayName?.[0] || 'U'}</span>
          {comment.photoURL && (
            <img 
              src={comment.photoURL} 
              alt={comment.displayName} 
              className="absolute inset-0 w-full h-full object-cover" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${comment.userId}`} className="font-bold hover:underline">{comment.displayName}</Link>
            <span className="text-[10px] opacity-40">
              {comment.createdAt ? (comment.createdAt.toDate ? formatDistanceToNow(comment.createdAt.toDate()) : 'just now') : 'just now'}
            </span>
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
              className="w-full bg-white/5 border border-white/10 p-1.5 rounded-lg text-xs outline-none focus:border-indigo-500 text-white"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="flex justify-end gap-1">
              <button onClick={() => setIsEditing(false)} className="p-1 glass-hover rounded-md"><X size={12}/></button>
              <button onClick={handleUpdate} className="p-1 bg-indigo-500 rounded-md text-white"><Check size={12}/></button>
            </div>
          </div>
        ) : (
          <p className="opacity-80 leading-relaxed">
            <MentionText text={comment.text} />
          </p>
        )}
      </div>
    </div>
  );
}
