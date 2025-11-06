import axios from 'axios';
import { User, Room, Message, ApiResponse, ImageUploadResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 请求拦截器，添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器，处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: async (userData: { username: string; email: string; password: string }): Promise<{ message: string; user: any; token: string }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 用户登录
  login: async (credentials: { email: string; password: string }): Promise<{ message: string; user: any; token: string }> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // 用户登出
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// 用户相关API
export const userAPI = {
  // 获取所有用户
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users');
    return response.data;
  },

  // 获取用户详情
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // 更新用户信息
  updateUser: async (userId: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },
};

// 聊天相关API
export const chatAPI = {
  // 获取用户的所有聊天室
  getRooms: async (): Promise<ApiResponse<Room[]>> => {
    const response = await api.get('/chats/rooms');
    return response.data;
  },

  // 创建新的群聊房间
  createRoom: async (roomData: { name: string; description?: string; participants: string[] }): Promise<ApiResponse<Room>> => {
    const response = await api.post('/chats/rooms', roomData);
    return response.data;
  },

  // 获取聊天室详情
  getRoomById: async (roomId: string): Promise<ApiResponse<Room>> => {
    const response = await api.get(`/chats/rooms/${roomId}`);
    return response.data;
  },

  // 获取聊天室消息
  getRoomMessages: async (roomId: string, page?: number): Promise<ApiResponse<Message[]>> => {
    const params = page ? `?page=${page}` : '';
    const response = await api.get(`/chats/rooms/${roomId}/messages${params}`);
    return response.data;
  },

  // 加入聊天室
  joinRoom: async (roomId: string): Promise<ApiResponse<Room>> => {
    const response = await api.post(`/chats/rooms/${roomId}/join`);
    return response.data;
  },

  // 通过群聊代码加入聊天室
  joinRoomByCode: async (inviteCode: string): Promise<ApiResponse<Room>> => {
    const response = await api.post('/chats/rooms/join-by-code', { inviteCode });
    return response.data;
  },

  // 获取聊天室的群聊代码
  getRoomInviteCode: async (roomId: string): Promise<ApiResponse<{ inviteCode: string }>> => {
    const response = await api.get(`/chats/rooms/${roomId}/invite-code`);
    return response.data;
  },

  // 重置聊天室的群聊代码
  resetRoomInviteCode: async (roomId: string): Promise<ApiResponse<{ inviteCode: string }>> => {
    const response = await api.post(`/chats/rooms/${roomId}/reset-invite-code`);
    return response.data;
  },

  // 离开聊天室
  leaveRoom: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/chats/rooms/${roomId}/leave`);
    return response.data;
  },
  
  // 标记聊天室消息为已读
  markRoomAsRead: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/chats/rooms/${roomId}/read`);
    return response.data;
  },
  
  // 获取消息的已读状态
  getMessageReadStatus: async (messageId: string): Promise<ApiResponse> => {
    const response = await api.get(`/chats/messages/${messageId}/read-status`);
    return response.data;
  }
};

// 文件上传API
export const uploadAPI = {
  // 上传图片
  uploadImage: async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default api;