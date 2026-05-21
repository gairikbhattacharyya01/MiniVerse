import React, { useState, useEffect, useRef } from 'react';
import { 
  Share, 
  Copy, 
  Twitter, 
  Send, 
  MessageCircle, 
  Check, 
  ExternalLink,
  Mail
} from 'lucide-react';

interface ShareButtonProps {
  postId: string;
  postText: string;
  userId: string;
  displayName: string;
}

export default function ShareButton({ postId, postText, userId, displayName }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Construct sharing information
  const postUrl = `${window.location.origin}/profile/${userId}?post=${postId}`;
  const shareText = `"${postText.length > 100 ? postText.substring(0, 97) + '...' : postText}" — by ${displayName} on @MiniVerse`;
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Toast Auto-Dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      showToast('Post link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      showToast('Could not copy link');
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`"${postText}" — ${displayName} on MiniVerse (${postUrl})`);
      showToast('Post content copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text:', err);
      showToast('Could not copy text');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MiniVerse Post by ${displayName}`,
          text: postText,
          url: postUrl,
        });
        showToast('Shared successfully!');
      } catch (err) {
        console.log('User cancelled or native share failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${postUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const shareEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent(`Interesting post on MiniVerse by ${displayName}`)}&body=${encodeURIComponent(`${postText}\n\nRead original post on MiniVerse:\n${postUrl}`)}`;
    window.open(url, '_self');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-indigo-400 text-white/50 active:scale-95 hover:bg-white/5 p-2 rounded-full cursor-pointer transition-all duration-200"
        title="Share Post"
      >
        <Share size={18} />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 glass rounded-2xl border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-[10px] font-bold text-indigo-400/80 px-3 py-1 uppercase tracking-wider border-b border-white/5 mb-1">
            Share Signal
          </div>
          
          <button 
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
          >
            <Copy size={14} className="text-zinc-400" />
            <span>Copy Post Link</span>
          </button>

          <button 
            onClick={handleCopyText}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
          >
            <Check size={14} className="text-emerald-400" />
            <span>Copy Post Text</span>
          </button>

          <div className="h-[1px] bg-white/5 my-1"></div>

          <button 
            onClick={shareX}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
          >
            <Twitter size={14} className="text-[#1d9bf0]" />
            <span>Post to X (Twitter)</span>
          </button>

          <button 
            onClick={shareWhatsApp}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
          >
            <MessageCircle size={14} className="text-[#25d366]" />
            <span>Send to WhatsApp</span>
          </button>

          <button 
            onClick={shareTelegram}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
          >
            <Send size={14} className="text-[#0088cc]" />
            <span>Send to Telegram</span>
          </button>

          <button 
            onClick={shareEmail}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
          >
            <Mail size={14} className="text-[#ea4335]" />
            <span>Send via Email</span>
          </button>

          {navigator.share && (
            <>
              <div className="h-[1px] bg-white/5 my-1"></div>
              <button 
                onClick={handleNativeShare}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#00ffd5]/80 hover:bg-[#00ffd5]/10 hover:text-[#00ffd5] transition-colors cursor-pointer text-left animate-pulse"
              >
                <ExternalLink size={14} />
                <span>System Share...</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* FLOATING ACTION TOAST OVERLAY (HIGH CRAFTSMANSHIP) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600/90 backdrop-blur-md text-white border border-indigo-400/30 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[9999] flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
          <Check size={14} className="text-[#00ffd5] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
