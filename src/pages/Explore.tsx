import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post as PostType } from '../types';
import { Hash, TrendingUp, Search, X } from 'lucide-react';
import PostItem from '../components/PostItem';

export default function Explore() {
  const [trendingPosts, setTrendingPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState('');

  const filterQuery = searchParams.get('q') || '';

  useEffect(() => {
    setSearchVal(filterQuery);
  }, [filterQuery]);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setSearchParams({ q: searchVal.trim() });
    } else {
      setSearchParams({});
    }
  };

  const clearFilter = () => {
    setSearchVal('');
    setSearchParams({});
  };

  const filteredPosts = trendingPosts.filter(post => {
    if (!filterQuery) return true;
    const queryLower = filterQuery.toLowerCase();
    const textLower = (post.text || '').toLowerCase();
    const displayNameLower = (post.displayName || '').toLowerCase();
    return textLower.includes(queryLower) || displayNameLower.includes(queryLower);
  });

  return (
    <div className="p-6 w-full space-y-8 mx-auto max-w-3xl">
      <header className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
          <Hash size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Explore</h1>
          <p className="opacity-50 text-sm text-slate-300">Discover popular posts in the MiniVerse</p>
        </div>
      </header>

      {/* Elegant Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <input
          type="text"
          placeholder="Search posts or #hashtags..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full bg-white/5 border border-white/10 hover:border-white/25 focus:border-indigo-500 outline-none text-white px-5 py-3.5 pl-12 pr-12 rounded-2xl text-sm transition-all shadow-inner placeholder-slate-500"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        {searchVal && (
          <button
            type="button"
            onClick={clearFilter}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {filterQuery && (
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs text-indigo-300 max-w-max">
          <span>Filtering by: <strong>{filterQuery}</strong></span>
          <button onClick={clearFilter} className="hover:text-white ml-1">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 ml-2">
          <TrendingUp size={20} />
          <span>{filterQuery ? 'Search Results' : 'Trending Now'}</span>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-16 opacity-40 italic">
            No posts found matching "{filterQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
