import React, { useState, useEffect } from 'react';
import { Message as MessageType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Edit2, Trash2, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: MessageType & { edited?: boolean };
  isMe: boolean;
  onEdit: (messageId: string, newText: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export default function MessageBubble({ message, isMe, onEdit, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEditText(message.text);
  }, [message.text]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim() || editText.trim() === message.text) {
      setIsEditing(false);
      return;
    }
    setLoading(true);
    try {
      await onEdit(message.id, editText.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Error editing message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    setLoading(true);
    try {
      await onDelete(message.id);
    } catch (err) {
      console.error('Error deleting message:', err);
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // Automatically reset delete confirmation after 4 seconds
  useEffect(() => {
    if (showDeleteConfirm) {
      const timer = setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteConfirm]);

  return (
    <div className={`flex w-full ${isMe ? 'justify-end animate-in fade-in slide-in-from-right-3' : 'justify-start animate-in fade-in slide-in-from-left-3'} group relative mb-4`}>
      <div className={`max-w-[75%] relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        
        {/* Message Bubble Container */}
        <div 
          className={`p-3 px-5 rounded-2xl text-sm transition-all duration-300 relative ${
            isMe 
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
              : 'glass text-white rounded-tl-none shadow-md'
          }`}
        >
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-2 min-w-[200px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                className="w-full bg-black/30 text-white border border-white/20 rounded-xl p-2 text-sm focus:outline-none focus:border-indigo-400 font-sans resize-none"
                rows={2}
                disabled={loading}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditText(message.text); }}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold transition-all text-white"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition-all flex items-center gap-1"
                  disabled={loading || !editText.trim()}
                >
                  <Check size={12} /> Save
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
              
              <div className={`text-[9px] mt-1 opacity-45 flex items-center gap-1.5 justify-end`}>
                <span>
                  {message.createdAt ? formatDistanceToNow(message.createdAt.toDate()) : 'sending...'}
                </span>
                {message.edited && (
                  <span className="italic bg-white/10 px-1.5 py-0.2 rounded-full font-medium">Edited</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hover actions panel - Sender only */}
        {isMe && !isEditing && (
          <div className="absolute right-0 -bottom-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex gap-1.5 p-1 rounded-xl z-20 glass border border-white/10 scale-90 origin-top-right">
            <button
              onClick={() => setIsEditing(true)}
              className="text-white/60 hover:text-[#00ffd5] p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              title="Edit message"
            >
              <Edit2 size={13} />
            </button>
            
            <button
              onClick={handleDeleteClick}
              className={`p-1 rounded-lg transition-all font-bold text-xs flex items-center cursor-pointer ${
                showDeleteConfirm 
                  ? 'text-red-400 bg-red-500/20 px-2' 
                  : 'text-white/60 hover:text-red-400 hover:bg-white/5'
              }`}
              title={showDeleteConfirm ? "Click again to delete" : "Delete message"}
            >
              {showDeleteConfirm ? (
                <span className="text-[9px] animate-pulse">Confirm?</span>
              ) : (
                <Trash2 size={13} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
