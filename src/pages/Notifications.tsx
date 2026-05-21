import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Notification as NotificationType } from '../types';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  AtSign, 
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', auth.currentUser.uid)
      // Removing orderBy to ensure it works without manual index
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationType[];
      // Sort client-side
      const sortedNotifs = notifs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
      setNotifications(sortedNotifs);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="text-pink-500" size={20} fill="currentColor" />;
      case 'comment': return <MessageCircle className="text-blue-500" size={20} fill="currentColor" />;
      case 'follow': return <UserPlus className="text-green-500" size={20} />;
      case 'mention': return <AtSign className="text-amber-500" size={20} />;
      default: return <Bell size={20} />;
    }
  };

  return (
    <div className="p-6 w-full space-y-8 mx-auto max-w-3xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
            <Bell size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
            <p className="opacity-50 text-sm">Stay updated with your connections</p>
          </div>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
          >
            <CheckCircle2 size={14}/> Mark all read
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-[32px]">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-6 flex gap-4 border-b border-white/5 transition-colors glass-hover cursor-pointer
                  ${notif.read ? 'opacity-70' : 'bg-white/5 border-l-4 border-indigo-500'}
                `}
                onClick={async () => {
                  if (!notif.read) {
                    await updateDoc(doc(db, 'notifications', notif.id), { read: true });
                  }
                }}
              >
                <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm leading-relaxed">
                      <Link to={`/profile/${notif.fromUserId}`} className="font-bold hover:underline">
                        {notif.fromUserName}
                      </Link>
                      <span className="opacity-80">
                        {notif.type === 'like' && ' liked your post'}
                        {notif.type === 'comment' && ' commented on your post'}
                        {notif.type === 'follow' && ' followed you'}
                        {notif.type === 'mention' && ' mentioned you in a post'}
                      </span>
                    </p>
                    <span className="text-[10px] opacity-40 whitespace-nowrap">
                      {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate()) : 'now'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center opacity-40 italic">
              Nothing but stars out here. Your universe is quiet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
