import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MentionTextProps {
  text: string;
}

export default function MentionText({ text }: MentionTextProps) {
  const navigate = useNavigate();
  const [resolving, setResolving] = useState<string | null>(null);

  if (!text) return null;

  // Split by @username tokens while keeping the tokens in the array
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);

  const handleMentionClick = async (e: React.MouseEvent, maybeMention: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rawUsername = maybeMention.slice(1); // remove the '@'
    const cleanUsername = rawUsername.trim().toLowerCase();
    
    setResolving(maybeMention);
    try {
      const usersRef = collection(db, 'users');
      // Exact check for lowercase username
      const q = query(usersRef, where('username', '==', cleanUsername), limit(1));
      const snap = await getDocs(q);
      
      let uid = '';
      if (!snap.empty) {
        uid = snap.docs[0].data().uid;
      } else {
        // Fallback checks / larger search for relaxed matching
        const fallbackSnap = await getDocs(query(usersRef, limit(150)));
        const found = fallbackSnap.docs.find(doc => {
          const u = doc.data();
          return u.username?.toLowerCase() === cleanUsername || u.name?.toLowerCase() === cleanUsername;
        });
        if (found) {
          uid = found.data().uid;
        }
      }
      
      if (uid) {
        navigate(`/profile/${uid}`);
      } else {
        // Fallback: navigate to explore/search
        navigate(`/explore`);
      }
    } catch (err) {
      console.error("Error resolving mention click:", err);
    } finally {
      setResolving(null);
    }
  };

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.startsWith('@') && part.length > 1) {
          const isCurrentlyResolving = resolving === part;
          return (
            <button
              key={index}
              onClick={(e) => handleMentionClick(e, part)}
              disabled={isCurrentlyResolving}
              className={`inline-block font-bold text-indigo-400 hover:text-[#00ffd5] hover:underline transition-all duration-200 cursor-pointer text-left focus:outline-none align-baseline ${
                isCurrentlyResolving ? 'opacity-40 animate-pulse' : ''
              }`}
              style={{ background: 'none', border: 'none', padding: 0 }}
              title={`View ${part}'s profile`}
            >
              {part}
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
