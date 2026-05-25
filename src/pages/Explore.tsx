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
import { Hash, TrendingUp } from 'lucide-react';
import PostItem from '../components/PostItem';

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
      <header className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
          <Hash size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Explore</h1>
          <p className="opacity-50 text-sm">Discover popular posts in the MiniVerse</p>
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
            <PostItem key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
