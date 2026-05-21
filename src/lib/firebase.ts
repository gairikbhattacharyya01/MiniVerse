import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDol6dC2C8ftFTE4YVj36Ym7L_miwJLi40",
  authDomain: "miniverse-0608.firebaseapp.com",
  projectId: "miniverse-0608",
  storageBucket: "miniverse-0608.appspot.com",
  messagingSenderId: "166927305958",
  appId: "1:166927305958:web:72499270dd58820f103f27"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const CLOUDINARY_CONFIG = {
  cloudName: "drvtii2mb",
  uploadPreset: "miniverse_preset"
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  const errorString = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorString);
  
  // Actually show the error to the user so they know why it's failing
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('insufficient')) {
    alert(`Permission Denied: You don't have permission to ${operationType} this item. (Path: ${path})`);
  } else {
    alert(`Firestore Error: ${message}`);
  }
  
  throw new Error(errorString);
}

export async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload failed");
  }
  const data = await res.json();
  return {
    url: data.secure_url,
    type: resourceType as 'image' | 'video'
  };
}

export async function uploadMultipleToCloudinary(files: File[]) {
  return Promise.all(files.map(file => uploadToCloudinary(file)));
}

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function createNotification(data: {
  type: 'like' | 'comment' | 'follow' | 'mention';
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  postId?: string;
}) {
  if (data.fromUserId === data.toUserId) return;
  
  try {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}
