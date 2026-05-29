import React, { useState, useEffect, useRef } from 'react';
import { 
  Share, 
  Copy, 
  Twitter, 
  Send, 
  MessageCircle, 
  Check, 
  CheckSquare,
  ExternalLink,
  Mail,
  Palette,
  Download,
  QrCode,
  Sparkles,
  X,
  Code,
  Link as LinkIcon,
  Layers,
  ArrowRight,
  Facebook,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ShareButtonProps {
  postId: string;
  postText: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  username?: string;
  isArticle?: boolean;
}

const GRADIENTS = [
  {
    id: 'cosmic',
    name: 'Cosmic Tint',
    colors: ['#4f46e5', '#9333ea', '#db2777'],
    canvasColors: ['rgba(79, 70, 229, 1)', 'rgba(147, 51, 234, 1)', 'rgba(219, 39, 119, 1)'],
    cssClass: 'from-[#4f46e5] via-[#9333ea] to-[#db2777]'
  },
  {
    id: 'boreal',
    name: 'Solar Boreal',
    colors: ['#0d9488', '#0891b2', '#059669'],
    canvasColors: ['rgba(13, 148, 136, 1)', 'rgba(8, 145, 178, 1)', 'rgba(5, 150, 105, 1)'],
    cssClass: 'from-[#0d9488] via-[#0891b2] to-[#059669]'
  },
  {
    id: 'flare',
    name: 'Solar Flare',
    colors: ['#f59e0b', '#ea580c', '#dc2626'],
    canvasColors: ['rgba(245, 158, 11, 1)', 'rgba(234, 88, 12, 1)', 'rgba(220, 38, 38, 1)'],
    cssClass: 'from-[#f59e0b] via-[#ea580c] to-[#dc2626]'
  },
  {
    id: 'cyberpunk',
    name: 'Neon Horizon',
    colors: ['#7c3aed', '#db2777', '#2563eb'],
    canvasColors: ['rgba(124, 58, 237, 1)', 'rgba(219, 39, 119, 1)', 'rgba(37, 99, 235, 1)'],
    cssClass: 'from-[#7c3aed] via-[#db2777] to-[#2563eb]'
  },
  {
    id: 'shadow',
    name: 'Nebula Void',
    colors: ['#1e1b4b', '#111827', '#311042'],
    canvasColors: ['rgba(30, 27, 75, 1)', 'rgba(17, 24, 39, 1)', 'rgba(49, 16, 66, 1)'],
    cssClass: 'from-[#1e1b4b] via-[#111827] to-[#311042]'
  }
];

export default function ShareButton({ 
  postId, 
  postText, 
  userId, 
  displayName, 
  photoURL, 
  username,
  isArticle = false 
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGradient, setActiveGradient] = useState('cosmic');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fetchedUsername, setFetchedUsername] = useState<string | null>(null);
  
  // Local states for QR and preloading
  const [preloadedAvatar, setPreloadedAvatar] = useState<HTMLImageElement | null>(null);
  const [preloadedQR, setPreloadedQR] = useState<HTMLImageElement | null>(null);

  // Sharing coordinates
  const postUrl = isArticle 
    ? `${window.location.origin}/explore?article=${postId}`
    : `${window.location.origin}/profile/${userId}?post=${postId}`;
    
  const shareText = isArticle
    ? `"${postText.length > 100 ? postText.substring(0, 97) + '...' : postText}" — Read on @MiniVerse News`
    : `"${postText.length > 100 ? postText.substring(0, 97) + '...' : postText}" — by ${displayName} on @MiniVerse`;

  // Fetch true username dynamically
  useEffect(() => {
    if (!isOpen || isArticle || !userId) {
      if (!isOpen) {
        setFetchedUsername(null);
      }
      return;
    }

    if (username) {
      setFetchedUsername(username);
      return;
    }

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData && uData.username) {
            setFetchedUsername(uData.username);
            return;
          }
        }
        // Failback to name parsing if username not explicitly stored
        if (displayName) {
          setFetchedUsername(displayName.toLowerCase().replace(/\s+/g, ''));
        }
      } catch (e) {
        console.warn('Could not fetch user profile for username:', e);
      }
    };

    fetchUser();
  }, [isOpen, userId, isArticle, username, displayName]);

  // Preload Image Avatar to prevent canvas CORS security blocks on download
  useEffect(() => {
    if (!isOpen) return;

    const avatarUrl = photoURL || (isArticle 
      ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&q=80'
      : '');
      
    if (!avatarUrl) {
      setPreloadedAvatar(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = avatarUrl;
    img.onload = () => {
      setPreloadedAvatar(img);
    };
    img.onerror = () => {
      setPreloadedAvatar(null);
    };
  }, [photoURL, isArticle, isOpen]);

  // Preload QR Code Image to prevent CORS canvas blocks on download inside Card
  useEffect(() => {
    if (!isOpen) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=255-255-255&bgcolor=15-23-42&data=${encodeURIComponent(postUrl)}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = qrUrl;
    img.onload = () => {
      setPreloadedQR(img);
    };
    img.onerror = () => {
      setPreloadedQR(null);
    };
  }, [isOpen, postUrl]);

  // Handle temporary notification banner dismissals
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  const copyToClipboard = async (textToCopy: string, method: 'link' | 'embed' | 'text') => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (method === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        triggerToast('Link copied to clipboard!');
      } else if (method === 'embed') {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
        triggerToast('Iframe embed code copied!');
      } else {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
        triggerToast('Copied post text!');
      }
    } catch (err) {
      console.error('Failed to copy state:', err);
      triggerToast('Could not execute copy');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isArticle ? `MiniVerse News: ${displayName}` : `MiniVerse Post by ${displayName}`,
          text: postText,
          url: postUrl,
        });
        triggerToast('Shared successfully!');
      } catch (err) {
        console.log('User cancelled web-share:', err);
      }
    } else {
      copyToClipboard(postUrl, 'link');
    }
  };

  // Generate poster graphic canvas and download locally
  const handleDownloadPoster = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient drawing
    const selectedGrad = GRADIENTS.find(g => g.id === activeGradient) || GRADIENTS[0];
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, selectedGrad.canvasColors[0]);
    grad.addColorStop(0.5, selectedGrad.canvasColors[1]);
    grad.addColorStop(1, selectedGrad.canvasColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dynamic Atmospheric Radial Bloom Behind the Card
    const glow = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 80, canvas.width / 2, canvas.height / 2, 580);
    glow.addColorStop(0, 'rgba(8, 11, 21, 0.45)');
    glow.addColorStop(0.5, selectedGrad.canvasColors[0].replace('1)', '0.28)'));
    glow.addColorStop(0.8, (selectedGrad.canvasColors[1] || selectedGrad.canvasColors[0]).replace('1)', '0.12)'));
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid overlays
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Outer glow circles for cosmos background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(canvas.width - 200, 150, 320, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary decorative orbit
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.beginPath();
    ctx.arc(100, canvas.height - 100, 240, 0, Math.PI * 2);
    ctx.stroke();

    // Ultra-thin Precise Coordinate HUD Crosshair Ticks in margins
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    const tickSize = 10;
    const cornerTicks = [
      { x: 50, y: 50 },
      { x: canvas.width - 50, y: 50 },
      { x: 50, y: canvas.height - 50 },
      { x: canvas.width - 50, y: canvas.height - 50 }
    ];
    cornerTicks.forEach(tick => {
      ctx.beginPath();
      ctx.moveTo(tick.x - tickSize, tick.y);
      ctx.lineTo(tick.x + tickSize, tick.y);
      ctx.moveTo(tick.x, tick.y - tickSize);
      ctx.lineTo(tick.x, tick.y + tickSize);
      ctx.stroke();
    });

    // Central graphic panel
    const cardX = 120;
    const cardY = 120;
    const cardWidth = canvas.width - 240;
    const cardHeight = canvas.height - 240;
    const cardRadius = 32;

    // Main Card shadow
    ctx.shadowColor = 'rgba(2, 6, 23, 0.75)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 24;

    // Styled slate dashboard card with high-tech backing
    ctx.fillStyle = 'rgba(8, 11, 21, 0.94)';
    ctx.beginPath();
    ctx.moveTo(cardX + cardRadius, cardY);
    ctx.lineTo(cardX + cardWidth - cardRadius, cardY);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + cardRadius);
    ctx.lineTo(cardX + cardWidth, cardY + cardHeight - cardRadius);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - cardRadius, cardY + cardHeight);
    ctx.lineTo(cardX + cardRadius, cardY + cardHeight);
    ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - cardRadius);
    ctx.lineTo(cardX, cardY + cardRadius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
    ctx.closePath();
    ctx.fill();

    // Reset shadow state for remaining layers
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Double Ring Glowing Card Borders
    // Outermost glowing buffer line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Sleek inner border reflecting dynamic lighting gradient
    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)'); // Glossy highlight top-left
    borderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    borderGrad.addColorStop(1, selectedGrad.canvasColors[0].replace('1)', '0.20)')); // Matching shimmer bottom-right
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Futuristic Neon L-Brackets precisely framing the card corners
    ctx.strokeStyle = selectedGrad.colors[1] || selectedGrad.colors[0];
    ctx.lineWidth = 2.5;
    const cl = 22; // corner length
    const co = -1; // offset outward
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(cardX + co + cl, cardY + co);
    ctx.lineTo(cardX + co, cardY + co);
    ctx.lineTo(cardX + co, cardY + co + cl);
    ctx.stroke();
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth - co - cl, cardY + co);
    ctx.lineTo(cardX + cardWidth - co, cardY + co);
    ctx.lineTo(cardX + cardWidth - co, cardY + co + cl);
    ctx.stroke();
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(cardX + co + cl, cardY + cardHeight - co);
    ctx.lineTo(cardX + co, cardY + cardHeight - co);
    ctx.lineTo(cardX + co, cardY + cardHeight - co - cl);
    ctx.stroke();
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth - co - cl, cardY + cardHeight - co);
    ctx.lineTo(cardX + cardWidth - co, cardY + cardHeight - co);
    ctx.lineTo(cardX + cardWidth - co, cardY + cardHeight - co - cl);
    ctx.stroke();

    // Avatar Drawing
    const avatarX = cardX + 54;
    const avatarY = cardY + 54;
    const avatarRadius = 36;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.clip();

    if (preloadedAvatar) {
      // Draw circular image avatar
      ctx.drawImage(
        preloadedAvatar, 
        avatarX - avatarRadius, 
        avatarY - avatarRadius, 
        avatarRadius * 2, 
        avatarRadius * 2
      );
    } else {
      // Draw sleek text letter initials circle
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((displayName ? displayName[0] : 'M').toUpperCase(), avatarX, avatarY);
    }
    ctx.restore();

    // Draw circular avatar stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Display Information
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textStartX = avatarX + avatarRadius + 24;

    // Small High-Tech Monospace Tag Guard Above Nickname
    ctx.fillStyle = selectedGrad.colors[1] || selectedGrad.colors[0];
    ctx.font = '900 11px monospace';
    ctx.fillText('COSMONET SIGNAL ENVELOPE [SECURE]', textStartX, avatarY - 32);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(displayName || 'MiniVerse Explorer', textStartX, avatarY - 14);

    // Handle (Username or email)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px monospace';
    ctx.fillText(isArticle ? '@cosmonews' : `@${fetchedUsername || username || userId.substring(0, 8)}`, textStartX, avatarY + 18);

    // Content Text
    const contentX = cardX + 54;
    const maxContentWidth = cardWidth - 340; // Reduced to fit larger QR code elegantly to its right!

    // Word Wrap Implementation finding lines first for dynamic sizing & alignment
    const getWrappedLines = (c: CanvasRenderingContext2D, txt: string, maxWidth: number) => {
      const words = txt.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = c.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(currentLine.trim());
          currentLine = words[n] + ' ';
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      return lines;
    };

    ctx.font = 'italic 500 22px sans-serif';
    const postTextWithQuotes = `"${postText}"`;
    const lines = getWrappedLines(ctx, postTextWithQuotes, maxContentWidth - 36);
    const lineHeight = 34;
    const totalTextHeight = lines.length * lineHeight;

    // Vertically center the quote area between profile bottom and footer divider line
    const yStart = 246;
    const yEnd = 520; // safe area before footer drawing
    const yCenter = yStart + (yEnd - yStart) / 2;
    let contentY = yCenter - (totalTextHeight / 2);
    if (contentY < yStart) {
      contentY = yStart;
    }

    // Elegant Gradient Quote Highlight Strip perfectly matched to content height!
    const quoteGrad = ctx.createLinearGradient(contentX, contentY, contentX, contentY + totalTextHeight);
    quoteGrad.addColorStop(0, selectedGrad.colors[0]);
    quoteGrad.addColorStop(0.5, selectedGrad.colors[1] || selectedGrad.colors[0]);
    quoteGrad.addColorStop(1, selectedGrad.colors[2] || selectedGrad.colors[0]);
    ctx.fillStyle = quoteGrad;
    ctx.fillRect(contentX, contentY + 2, 5, Math.max(34, totalTextHeight - 4));

    // Anchor cap dot at the top of Quote Line
    ctx.fillStyle = selectedGrad.colors[1] || selectedGrad.colors[0];
    ctx.fillRect(contentX - 2, contentY - 3, 9, 4);

    // Draw lines
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], contentX + 24, contentY + (i * lineHeight));
    }

    // QR Code Drawing (Embedded within the card itself!) - Upgraded and enlarged!
    const qrWidth = 150;
    const qrHeight = 150;
    const qrX = cardX + cardWidth - 54 - qrWidth; // Align with the right margin of the card
    const qrY = cardY + 54; // Align with the avatar height on the right side

    // Draw a slate background-panel for QR Code to give a pristine card-in-card feel
    const panelPadding = 12;
    ctx.fillStyle = 'rgba(7, 10, 20, 0.82)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    
    // Draw rounded background panel for QR code
    const px = qrX - panelPadding;
    const py = qrY - panelPadding;
    const pw = qrWidth + (panelPadding * 2);
    const ph = qrHeight + (panelPadding * 2) + 36; // larger extra space for scan & view subtexts
    const pr = 16; // radius

    ctx.beginPath();
    ctx.moveTo(px + pr, py);
    ctx.lineTo(px + pw - pr, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr);
    ctx.lineTo(px + pw, py + ph - pr);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - pr, py + ph);
    ctx.lineTo(px + pr, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - pr);
    ctx.lineTo(px, py + pr);
    ctx.quadraticCurveTo(px, py, px + pr, py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Radar Scanning Corner Ticks wrapper for preloaded QR panel
    ctx.strokeStyle = selectedGrad.colors[1] || selectedGrad.colors[0];
    ctx.lineWidth = 2;
    const p_cl = 12; // panel corner length
    // Top-left
    ctx.beginPath();
    ctx.moveTo(px + p_cl, py); ctx.lineTo(px, py); ctx.lineTo(px, py + p_cl); ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(px + pw - p_cl, py); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw, py + p_cl); ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(px + p_cl, py + ph); ctx.lineTo(px, py + ph); ctx.lineTo(px, py + ph - p_cl); ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(px + pw - p_cl, py + ph); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px + pw, py + ph - p_cl); ctx.stroke();

    // Delicate HUD Crosshair Intersection behind QR code area
    ctx.strokeStyle = selectedGrad.canvasColors[0].replace('1)', '0.05)');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(qrX + qrWidth/2, qrY - 4); ctx.lineTo(qrX + qrWidth/2, qrY + qrHeight + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qrX - 4, qrY + qrHeight/2); ctx.lineTo(qrX + qrWidth + 4, qrY + qrHeight/2); ctx.stroke();

    if (preloadedQR) {
      // Draw actual QR Code inside the panel, with slight rounded borders
      ctx.save();
      
      // Let's draw a rounded clip for the QR code image
      ctx.beginPath();
      const qrRadius = 8;
      ctx.moveTo(qrX + qrRadius, qrY);
      ctx.lineTo(qrX + qrWidth - qrRadius, qrY);
      ctx.quadraticCurveTo(qrX + qrWidth, qrY, qrX + qrWidth, qrY + qrRadius);
      ctx.lineTo(qrX + qrWidth, qrY + qrHeight - qrRadius);
      ctx.quadraticCurveTo(qrX + qrWidth, qrY + qrHeight, qrX + qrWidth - qrRadius, qrY + qrHeight);
      ctx.lineTo(qrX + qrRadius, qrY + qrHeight);
      ctx.quadraticCurveTo(qrX, qrY + qrHeight, qrX, qrY + qrHeight - qrRadius);
      ctx.lineTo(qrX, qrY + qrRadius);
      ctx.quadraticCurveTo(qrX, qrY, qrX + qrRadius, qrY);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(preloadedQR, qrX, qrY, qrWidth, qrHeight);
      ctx.restore();

      // Laser Scanner Overlay Beam
      ctx.fillStyle = selectedGrad.canvasColors[0].replace('1)', '0.22)');
      ctx.fillRect(qrX, qrY + 12, qrWidth, 2);
      ctx.fillStyle = selectedGrad.canvasColors[0].replace('1)', '0.03)');
      ctx.fillRect(qrX, qrY + 14, qrWidth, 8);
    } else {
      // Draw placeholder text / loading state if not yet loaded
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(qrX, qrY, qrWidth, qrHeight);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOADING QR', qrX + (qrWidth / 2), qrY + (qrHeight / 2));
    }

    // Add caption label directly below the QR Code
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = selectedGrad.colors[1] || selectedGrad.colors[0];
    ctx.font = '900 10px monospace';
    // Align horizontally with the center of QR
    ctx.fillText('SCAN PROFILE SIGNAL', qrX + (qrWidth / 2), qrY + qrHeight + 8);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('VIEW ON MINIVERSE', qrX + (qrWidth / 2), qrY + qrHeight + 20);

    // Bottom Watermark branding
    const footerY = cardY + cardHeight - 48;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 44, footerY - 24);
    ctx.lineTo(cardX + cardWidth - 44, footerY - 24);
    ctx.stroke();

    // High fidelity telemetry details stamp
    const randNode = Math.floor(100 + Math.random() * 899);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.font = '900 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`TOKEN_AUTH: OK // LAT_INDEX: 45.109 // LON_INDEX: 13.904 // RECV: STATION_${randNode}`, cardX + (cardWidth / 2), footerY - 36);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('🌌 MINIVERSE COSMONET SIGNAL', cardX + 44, footerY - 4);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SECURE TRANSMISSION ENVELOPE // LVL_1', cardX + cardWidth - 44, footerY - 4);

    // Download Link Click simulation
    const link = document.createElement('a');
    link.download = `miniverse_${isArticle ? 'news' : 'post'}_${postId.substring(0, 6)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Safe download handler for the QR code target
  const handleDownloadQR = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=255-255-255&bgcolor=15-23-42&data=${encodeURIComponent(postUrl)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `miniverse_qr_${postId.substring(0, 6)}.png`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      triggerToast('QR code downloaded successfully!');
    } catch (err) {
      // CORS fallback: opens high-quality QR in window tab
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=255-255-255&bgcolor=15-23-42&data=${encodeURIComponent(postUrl)}`, '_blank');
    }
  };

  const shareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${postUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent(`MiniVerse cosmic link share from ${displayName}`)}&body=${encodeURIComponent(`${postText}\n\nRead fully inside the MiniVerse:\n${postUrl}`)}`;
    window.open(url, '_self');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareInstagram = () => {
    // Copy link automatically & download the card poster
    copyToClipboard(postUrl, 'link');
    triggerToast('Instagram: Copied link & prepared card download!');
    setTimeout(() => {
      handleDownloadPoster();
    }, 300);
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }, 1500);
  };

  // Embed generation string
  const embedCode = `<iframe src="${postUrl}" width="100%" height="320" style="border:1px solid rgba(255,255,255,0.1);border-radius:16px;background:#0f172a;" allow="autoplay; clipboard-write"></iframe>`;

  const currGrad = GRADIENTS.find(g => g.id === activeGradient) || GRADIENTS[0];

  return (
    <div className="relative inline-block">
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="hover:text-indigo-400 text-white/50 active:scale-95 hover:bg-white/5 p-2 rounded-full cursor-pointer transition-all duration-200"
        title="Share"
      >
        <Share size={18} />
      </button>

      {/* PORTAL MODAL (UPGRADED DISCOVERY SUITE) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            {/* Dark blur glass backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#020617]/85 backdrop-blur-md"
            />

            {/* Main Modal Structure - Optimized with Unified Outer Scrolling on Mobile */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-4xl bg-[#0b0f19] border border-white/10 rounded-[24px] sm:rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden z-20 max-h-[92vh] md:max-h-[85vh]"
            >
              {/* TOP CLOSE BUTTON (RESPONSIVE) */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-40 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* LEFT COLUMN: VISUAL SHARING CARD CREATOR */}
              <div className="w-full md:w-[42%] bg-[#080b12] p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase text-[#00ffd5] tracking-widest">
                    <Palette size={13} />
                    <span>Card Designer</span>
                  </div>

                  {/* Realtime HTML Card Mockup */}
                  <div className="relative aspect-[1.6] w-full bg-[#080b12] rounded-2xl p-4 text-white shadow-2xl overflow-hidden flex flex-col justify-between border border-white/10 select-none transition-all duration-300 group">
                    {/* Glowing dynamic background skin block utilizing the active gradient skin */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${currGrad.cssClass} opacity-35 mix-blend-screen transition-all duration-500`} />
                    
                    {/* Soft atmospheric radial dark vignette to focus the card */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#04060a_95%)] opacity-80" />
                    
                    {/* Corner Cyber bracket lines matching the active skin's theme colors */}
                    <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 transition-colors duration-500 opacity-80" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 transition-colors duration-500 opacity-80" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />
                    <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 transition-colors duration-500 opacity-80" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />
                    <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 transition-colors duration-500 opacity-80" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />

                    {/* Background decor nodes */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-indigo-500/5 blur-[60px]" />
                    <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full border border-white/5" />
                    
                    {/* Header profile info with matching QR Code! */}
                    <div className="flex items-center justify-between gap-2 z-10 w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-900/95 overflow-hidden shrink-0 border border-white/20 flex items-center justify-center relative shadow-lg shadow-black/40">
                          <span className="text-xs font-black text-white/50">{(displayName ? displayName[0] : 'M').toUpperCase()}</span>
                          {(photoURL || isArticle) && (
                            <img 
                              src={photoURL || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&q=80'} 
                              alt="" 
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[6px] tracking-[0.16em] font-black uppercase font-mono block mb-px opacity-90 transition-colors duration-500" style={{ color: currGrad.colors[1] || currGrad.colors[0] }}>SIGNAL ENVELOPE [SECURE]</span>
                          <div className="text-[12px] font-extrabold tracking-tight text-white truncate leading-none mb-0.5">{displayName || 'Explorer'}</div>
                          <div className="text-[8px] text-slate-400 font-mono truncate leading-none">
                            {isArticle ? '@cosmonews' : `@${fetchedUsername || username || userId.substring(0, 6)}`}
                          </div>
                        </div>
                      </div>
 
                      {/* Matching QR Code alignment inside Mockup - Enlarged for beautiful high fidelity */}
                      <div className="flex flex-col items-center gap-1 bg-[#070e1b] rounded-lg p-1.5 border shrink-0 scale-95 sm:scale-100 origin-top-right relative shadow-lg transition-colors duration-500" style={{ borderColor: `${currGrad.colors[1] || currGrad.colors[0]}33` }}>
                        {/* Aperture corner marks */}
                        <div className="absolute top-0 left-0 w-1 h-1 border-t border-l transition-colors duration-500" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />
                        <div className="absolute top-0 right-0 w-1 h-1 border-t border-r transition-colors duration-500" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />
                        <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l transition-colors duration-500" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />
                        <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r transition-colors duration-500" style={{ borderColor: currGrad.colors[1] || currGrad.colors[0] }} />

                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=255-255-255&bgcolor=7-14-27&data=${encodeURIComponent(postUrl)}`} 
                            alt="Live Post QR Code" 
                            className="w-full h-full opacity-90 block" 
                          />
                          {/* Pulsing scanning line over QR preview */}
                          <div className="absolute top-0 left-0 right-0 h-0.5 shadow-lg animate-[bounce_2s_infinite] transition-colors duration-500" style={{ backgroundColor: currGrad.colors[1] || currGrad.colors[0], boxShadow: `0 2px 8px ${currGrad.colors[1] || currGrad.colors[0]}` }} />
                        </div>
                        <span className="text-[4.5px] font-black tracking-widest leading-none mt-0.5 transition-colors duration-500" style={{ color: currGrad.colors[1] || currGrad.colors[0] }}>SCAN PROFILE</span>
                      </div>
                    </div>

                    {/* Excerpt Body with theme matching outline and glow */}
                    <div 
                      className="my-2.5 z-10 border-l-[3px] pl-2.5 pr-12 py-0.5 bg-gradient-to-r rounded-r-sm transition-all duration-500" 
                      style={{ 
                        borderColor: currGrad.colors[1] || currGrad.colors[0],
                        backgroundImage: `linear-gradient(to right, ${currGrad.colors[0]}10, transparent)`
                      }}
                    >
                      <p className="text-[11px] font-sans font-medium line-clamp-3 text-slate-100/95 leading-relaxed italic">
                        "{postText}"
                      </p>
                    </div>

                    {/* Logo footer */}
                    <div className="flex items-center justify-between text-[7px] font-mono tracking-wider font-extrabold uppercase z-10 border-t border-white/10 pt-2 mt-1 transition-colors duration-500" style={{ color: `${currGrad.colors[1] || currGrad.colors[0]}cc` }}>
                      <span className="flex items-center gap-1">🌌 MINIVERSE COSMONET <span className="text-[5px] text-slate-500">//</span> SIGNAL</span>
                      <span className="text-slate-500 text-[6px] tracking-widest lowercase">station_envelope // verified</span>
                    </div>
                  </div>

                  {/* Gradient preset selectors */}
                  <div className="mt-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Select Theme Skin</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {GRADIENTS.map((g) => (
                        <button 
                          key={g.id}
                          onClick={() => setActiveGradient(g.id)}
                          className={`w-6 h-6 rounded-full bg-gradient-to-br ${g.cssClass} transition-all duration-200 shrink-0 relative cursor-pointer ${
                            activeGradient === g.id ? 'ring-2 ring-indigo-400 scale-110 shadow-md' : 'hover:scale-105 opacity-80'
                          }`}
                          title={g.name}
                        >
                          {activeGradient === g.id && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HIGH VISIBILITY INTEGRATION: MiniVerse Portal Scanning Explanation */}
                  <div className="mt-4 p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-start gap-2.5">
                    <QrCode size={18} className="text-[#00ffd5] shrink-0 mt-0.5 animate-pulse" />
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-black uppercase text-[#00ffd5] tracking-widest leading-none mb-1">Interactive Portal Target</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                        Anyone scanning the enlarged QR code on your card is automatically directed to your customized **MiniVerse Profile** page!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download graphics action */}
                <button 
                  onClick={handleDownloadPoster}
                  className="w-full mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95"
                >
                  <Download size={13} />
                  <span>Download Share Card</span>
                </button>
              </div>

              {/* RIGHT COLUMN: LINK HUB & INTERACTIVE OPTIONS */}
              <div className="flex-1 p-5 md:p-6 flex flex-col justify-between md:overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="text-indigo-400 animate-pulse" size={16} />
                    <h2 className="text-base font-black tracking-tighter text-white">Share Transmission Suite</h2>
                  </div>
                  <p className="text-xs text-slate-400 mb-5">Broadcast this signal to other worlds in your coordinate systems.</p>

                  <div className="space-y-4">
                    {/* URL Link Input Panel */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <LinkIcon size={10} />
                        Direct Link Token
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={postUrl}
                          className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono outline-none select-all min-w-0"
                        />
                        <button 
                          onClick={() => copyToClipboard(postUrl, 'link')}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl text-white transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          {copiedLink ? <CheckSquare size={13} className="text-[#00ffd5]" /> : <Copy size={13} />}
                          <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Grid Social Networks sharing */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
                        <Layers size={10} />
                        Warp Pathways
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button 
                          onClick={shareX}
                          className="flex items-center justify-center gap-2 p-3 bg-black/60 hover:bg-black border border-white/5 hover:border-indigo-500/30 rounded-xl text-xs font-semibold text-white/90 transition-all cursor-pointer"
                        >
                          <Twitter size={13} className="text-[#1d9bf0]" />
                          <span>X / Twitter</span>
                        </button>

                        <button 
                          onClick={shareFacebook}
                          className="flex items-center justify-center gap-2 p-3 bg-blue-950/20 hover:bg-blue-950/40 border border-white/5 hover:border-blue-500/30 rounded-xl text-xs font-semibold text-white/90 transition-all cursor-pointer"
                        >
                          <Facebook size={13} className="text-[#1877f2]" />
                          <span>Facebook</span>
                        </button>

                        <button 
                          onClick={shareInstagram}
                          className="flex items-center justify-center gap-2 p-3 bg-pink-950/20 hover:bg-pink-950/40 border border-white/5 hover:border-pink-500/30 rounded-xl text-xs font-semibold text-white/90 transition-all cursor-pointer"
                        >
                          <Instagram size={13} className="text-[#e1306c]" />
                          <span>Instagram</span>
                        </button>

                        <button 
                          onClick={shareWhatsApp}
                          className="flex items-center justify-center gap-2 p-3 bg-[#128c7e]/10 hover:bg-[#128c7e]/20 border border-white/5 hover:border-[#128c7e]/30 rounded-xl text-xs font-semibold text-white/90 transition-all cursor-pointer"
                        >
                          <MessageCircle size={13} className="text-[#25d366]" />
                          <span>WhatsApp</span>
                        </button>

                        <button 
                          onClick={shareTelegram}
                          className="flex items-center justify-center gap-2 p-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-white/5 hover:border-[#0088cc]/30 rounded-xl text-xs font-semibold text-white/90 transition-all cursor-pointer"
                        >
                          <Send size={13} className="text-[#0088cc]" />
                          <span>Telegram</span>
                        </button>

                        <button 
                          onClick={shareEmail}
                          className="flex items-center justify-center gap-2 p-3 bg-slate-800/60 hover:bg-slate-800 border border-white/5 hover:border-slate-500/30 rounded-xl text-xs font-semibold text-white/90 transition-all cursor-pointer"
                        >
                          <Mail size={13} className="text-[#ea4335]" />
                          <span>Direct Email</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM REGION: STREAMLINED STANDALONE OS NATIVE SHARE */}
                <div className="mt-6 pt-5 border-t border-white/5">
                  <button 
                    onClick={handleNativeShare}
                    className="w-full bg-[#00ffd5]/10 hover:bg-[#00ffd5]/20 text-[#00ffd5] border border-[#00ffd5]/25 font-black tracking-wide text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#00ffd5]/5"
                  >
                    <ExternalLink size={13} />
                    <span>Trigger OS System Share</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION TOAST OVERLAY (HIGH CRAFTSMANSHIP) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, translateX: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, translateX: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, translateX: '-50%' }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 bg-[#4f46e5]/90 backdrop-blur-md text-white border border-[#818cf8]/40 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[9999] flex items-center gap-2 whitespace-nowrap"
          >
            <CheckSquare size={14} className="text-[#00ffd5] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
