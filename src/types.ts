export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  coverURL?: string;
  bio?: string;
  city?: string;
  state?: string;
  birthdate?: string;
  followers?: string[];
  following?: string[];
  createdAt: any;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

export interface Post {
  id: string;
  text: string;
  media?: string; // Legacy single image
  mediaItems?: MediaItem[]; // New multiple media support
  userId: string;
  displayName: string;
  photoURL?: string;
  likes: string[];
  reposts?: string[];
  isRepost?: boolean;
  originalPostId?: string;
  originalPostAuthor?: string;
  commentsCount: number;
  createdAt: any;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  postId?: string;
  postOwnerId?: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  postId?: string;
  read: boolean;
  createdAt: any;
}
