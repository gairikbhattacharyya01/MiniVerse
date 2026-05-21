import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post as PostType } from '../types';
import { Hash, TrendingUp, Heart, MessageCircle, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Explore() {
  const [trendingPosts, setTrendingPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostType[];
      
      const sorted = [...posts].sort((a, b) => {
        const aEng = (a.likes?.length || 0) + (a.commentsCount || 0) + (a.reposts?.length || 0);
        const bEng = (b.likes?.length || 0) + (b.commentsCount || 0) + (b.reposts?.length || 0);
        return bEng - aEng;
      });
      
      setTrendingPosts(sorted);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-6 w-full space-y-8 mx-auto max-w-3xl">
      <header className="flex flex-col md:flex-row md:items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
          <Hash size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Explore</h1>
          <p className="opacity-50 text-sm">Discover popular signals in the universe</p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 ml-2">
          <TrendingUp size={20} />
          <span>Trending Now</span>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          trendingPosts.map((post) => (
            <div key={post.id} className="glass p-6 rounded-3xl group transition-all hover:bg-white/10">
              <div className="flex gap-4">
                <Link to={`/profile/${post.userId}`} className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                    {post.photoURL ? (
                      <img src={post.photoURL} alt={post.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-600 text-xs font-bold uppercase">
                        {post.displayName?.[0]}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${post.userId}`} className="font-bold hover:underline">{post.displayName}</Link>
                    <span className="text-xs opacity-40">· {post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) : 'recently'}</span>
                  </div>
                  <p className="mt-2 text-[15px] opacity-90 line-clamp-3 leading-relaxed">{post.text}</p>
                  <div className="flex gap-4 mt-4 text-white/40 text-[13px]">
                    <div className="flex items-center gap-1.5"><Heart size={16}/> {post.likes?.length || 0}</div>
                    <div className="flex items-center gap-1.5"><MessageCircle size={16}/> {post.commentsCount || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
