import api from './api';
import { User, FriendRequest, Room } from '../types';

// 获取用户列表（支持搜索）
export const getUsers = async (searchQuery?: string): Promise<User[]> => {
  try {
    const url = searchQuery 
      ? `/users/search?q=${encodeURIComponent(searchQuery)}`
      : '/users';
    
    const response = await api.get(url);
    return response.data.data || [];
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
};

// 获取好友列表
export const getFriends = async (): Promise<User[]> => {
  try {
    const response = await api.get('/friends');
    return response.data.data || [];
  } catch (error) {
    console.error('获取好友列表失败:', error);
    throw error;
  }
};

// 发送好友请求
export const sendFriendRequest = async (userId: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/friends/request', { recipientId: userId });
    return response.data;
  } catch (error) {
    console.error('发送好友请求失败:', error);
    throw error;
  }
};

// 获取好友请求列表
export const getFriendRequests = async (): Promise<FriendRequest[]> => {
  try {
    const response = await api.get('/friends/requests');
    return response.data.data || [];
  } catch (error) {
    console.error('获取好友请求列表失败:', error);
    throw error;
  }
};

// 处理好友请求
export const respondToFriendRequest = async (requestId: string, accept: boolean): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/friends/requests/${requestId}`, { action: accept ? 'accept' : 'reject' });
    return response.data;
  } catch (error) {
    console.error('处理好友请求失败:', error);
    throw error;
  }
};

// 删除好友
export const deleteFriend = async (friendId: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  } catch (error) {
    console.error('删除好友失败:', error);
    throw error;
  }
};

// 创建或获取私聊房间
export const getOrCreateDirectMessage = async (userId: string): Promise<Room> => {
  try {
    const response = await api.post(`/friends/direct-message/${userId}`, {});
    return response.data.data;
  } catch (error) {
    console.error('创建或获取私聊房间失败:', error);
    throw error;
  }
};

// 获取私聊房间列表
export const getDirectMessages = async (): Promise<Room[]> => {
  try {
    const response = await api.get('/friends/direct-messages');
    return response.data.data || [];
  } catch (error) {
    console.error('获取私聊房间列表失败:', error);
    throw error;
  }
};