export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  description: string;
  participants: User[];
  admin?: User;
  lastMessage?: Message;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  room: string;
  sender: User;
  content: string;
  type: 'text' | 'image';
  timestamp: string;
  readBy: {
    user: string;
    readAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ChatState {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  onlineUsers: string[];
  isLoading: boolean;
  unreadCounts: { [roomId: string]: number };
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface ImageUploadResponse {
  message: string;
  imageUrl: string;
}

export interface FriendRequest {
  _id: string;
  sender: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}