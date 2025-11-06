import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Room, Message, ChatState } from '../types';
import { chatAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

// 聊天状态类型
interface ChatContextType extends ChatState {
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: Room | null) => void;
  sendMessage: (roomId: string, content: string, type?: 'text' | 'image') => void;
  sendPrivateMessage: (recipientId: string, content: string, type?: 'text' | 'image') => void;
  createRoom: (name: string, description?: string, participants?: string[]) => Promise<Room>;
  joinRoom: (roomId: string) => Promise<void>;
  joinRoomByCode: (inviteCode: string) => Promise<Room>;
  getRoomInviteCode: (roomId: string) => Promise<string>;
  resetRoomInviteCode: (roomId: string) => Promise<string>;
  leaveRoom: (roomId: string) => Promise<void>;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  markRoomAsRead: (roomId: string) => Promise<void>;
  getMessageReadStatus: (messageId: string) => Promise<any>;
}

// 聊天状态初始值
const initialState: ChatState = {
  rooms: [],
  currentRoom: null,
  messages: [],
  onlineUsers: [],
  isLoading: false,
  unreadCounts: {},
};

// 聊天状态动作类型
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ROOMS'; payload: Room[] }
  | { type: 'ADD_ROOM'; payload: Room }
  | { type: 'UPDATE_ROOM'; payload: Room }
  | { type: 'REMOVE_ROOM'; payload: string }
  | { type: 'SET_CURRENT_ROOM'; payload: Room | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_ONLINE_USER'; payload: string }
  | { type: 'REMOVE_ONLINE_USER'; payload: string }
  | { type: 'SET_ONLINE_USERS'; payload: string[] }
  | { type: 'MARK_ROOM_AS_READ'; payload: string }
  | { type: 'UPDATE_UNREAD_COUNT'; payload: { roomId: string; count: number } };

// 聊天状态reducer
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ROOMS':
      // 从API响应中提取未读消息数量
      const unreadCounts: { [roomId: string]: number } = {};
      action.payload.forEach((room: any) => {
        unreadCounts[room._id] = room.unreadCount || 0;
      });
      
      return {
        ...state,
        rooms: action.payload,
        unreadCounts,
      };
    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [action.payload, ...state.rooms],
      };
    case 'UPDATE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map(room =>
          room._id === action.payload._id ? action.payload : room
        ),
        currentRoom: state.currentRoom?._id === action.payload._id
          ? action.payload
          : state.currentRoom,
      };
    case 'REMOVE_ROOM':
      return {
        ...state,
        rooms: state.rooms.filter(room => room._id !== action.payload),
        currentRoom: state.currentRoom?._id === action.payload
          ? null
          : state.currentRoom,
      };
    case 'SET_CURRENT_ROOM':
      return {
        ...state,
        currentRoom: action.payload,
        messages: [], // 清空消息，准备加载新房间的消息
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'MARK_ROOM_AS_READ':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: 0
        }
      };
    case 'UPDATE_UNREAD_COUNT':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.roomId]: action.payload.count
        }
      };
    case 'ADD_ONLINE_USER':
      return {
        ...state,
        onlineUsers: [...state.onlineUsers, action.payload],
      };
    case 'REMOVE_ONLINE_USER':
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter(id => id !== action.payload),
      };
    case 'SET_ONLINE_USERS':
      return {
        ...state,
        onlineUsers: action.payload,
      };
    default:
      return state;
  }
};

// 创建聊天上下文
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 聊天提供者组件
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // 获取聊天室列表
  const fetchRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await chatAPI.getRooms();
      if (response.data) {
        dispatch({ type: 'SET_ROOMS', payload: response.data });
      }
    } catch (error) {
      console.error('获取聊天室列表失败:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated]);

  // 获取聊天室消息
  const fetchMessages = useCallback(async (roomId: string) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await chatAPI.getRoomMessages(roomId);
      if (response.data) {
        dispatch({ type: 'SET_MESSAGES', payload: response.data });
      }
    } catch (error) {
      console.error('获取聊天消息失败:', error);
    }
  }, [isAuthenticated]);

  // 设置当前聊天室
  const setCurrentRoom = useCallback((room: Room | null) => {
    dispatch({ type: 'SET_CURRENT_ROOM', payload: room });
    
    if (room) {
      // 延迟加入Socket房间，确保用户已登录
      setTimeout(() => {
        socketService.joinRoom(room._id);
      }, 100);
      // 获取房间消息
      fetchMessages(room._id);
    }
  }, [fetchMessages]);

  // 发送消息
  const sendMessage = (roomId: string, content: string, type: 'text' | 'image' = 'text') => {
    socketService.sendMessage(roomId, content, type);
  };

  // 发送私聊消息
  const sendPrivateMessage = (recipientId: string, content: string, type: 'text' | 'image' = 'text') => {
    socketService.sendPrivateMessage(recipientId, content, type);
  };

  // 创建聊天室
  const createRoom = async (name: string, description?: string, participants: string[] = []): Promise<Room> => {
    if (!isAuthenticated) throw new Error('未认证');
    
    try {
      const response = await chatAPI.createRoom({ name, description, participants });
      if (response.data) {
        dispatch({ type: 'ADD_ROOM', payload: response.data });
        return response.data;
      }
      throw new Error('创建聊天室失败');
    } catch (error) {
      console.error('创建聊天室失败:', error);
      throw error;
    }
  };

  // 加入聊天室
  const joinRoom = async (roomId: string) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await chatAPI.joinRoom(roomId);
      if (response.data) {
        dispatch({ type: 'UPDATE_ROOM', payload: response.data });
      }
    } catch (error) {
      console.error('加入聊天室失败:', error);
      throw error;
    }
  };

  // 通过群聊代码加入聊天室
  const joinRoomByCode = async (inviteCode: string): Promise<Room> => {
    if (!isAuthenticated) throw new Error('未认证');
    
    try {
      const response = await chatAPI.joinRoomByCode(inviteCode);
      if (response.data) {
        dispatch({ type: 'ADD_ROOM', payload: response.data });
        return response.data;
      }
      throw new Error('通过群聊代码加入聊天室失败');
    } catch (error) {
      console.error('通过群聊代码加入聊天室失败:', error);
      throw error;
    }
  };

  // 获取聊天室的群聊代码
  const getRoomInviteCode = async (roomId: string): Promise<string> => {
    if (!isAuthenticated) throw new Error('未认证');
    
    try {
      const response = await chatAPI.getRoomInviteCode(roomId);
      if (response.data) {
        return response.data.inviteCode;
      }
      throw new Error('获取群聊代码失败');
    } catch (error) {
      console.error('获取群聊代码失败:', error);
      throw error;
    }
  };

  // 重置聊天室的群聊代码
  const resetRoomInviteCode = async (roomId: string): Promise<string> => {
    if (!isAuthenticated) throw new Error('未认证');
    
    try {
      const response = await chatAPI.resetRoomInviteCode(roomId);
      if (response.data) {
        return response.data.inviteCode;
      }
      throw new Error('重置群聊代码失败');
    } catch (error) {
      console.error('重置群聊代码失败:', error);
      throw error;
    }
  };

  // 离开聊天室
  const leaveRoom = async (roomId: string) => {
    if (!isAuthenticated) return;
    
    try {
      await chatAPI.leaveRoom(roomId);
      dispatch({ type: 'REMOVE_ROOM', payload: roomId });
      // 如果是当前聊天室，清空当前状态
      if (state.currentRoom && state.currentRoom._id === roomId) {
        dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
        dispatch({ type: 'SET_MESSAGES', payload: [] });
      }
    } catch (error) {
      console.error('离开聊天室失败:', error);
      throw error;
    }
  };
  
  // 标记聊天室消息为已读
  const markRoomAsRead = useCallback(async (roomId: string) => {
    try {
      await chatAPI.markRoomAsRead(roomId);
      dispatch({ type: 'MARK_ROOM_AS_READ', payload: roomId });
    } catch (error: any) {
      console.error('标记消息已读失败:', error);
    }
  }, []);
  
  // 获取消息的已读状态
  const getMessageReadStatus = useCallback(async (messageId: string) => {
    try {
      const response = await chatAPI.getMessageReadStatus(messageId);
      return response.data;
    } catch (error: any) {
      console.error('获取消息已读状态失败:', error);
      return null;
    }
  }, []);

  // 添加在线用户
  const addOnlineUser = (userId: string) => {
    dispatch({ type: 'ADD_ONLINE_USER', payload: userId });
  };

  // 移除在线用户
  const removeOnlineUser = (userId: string) => {
    dispatch({ type: 'REMOVE_ONLINE_USER', payload: userId });
  };

  // 初始化Socket连接和事件监听
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (token) {
        // 连接Socket
        socketService.connect(token).then(() => {
          // 用户登录
          socketService.userLogin(user._id);
          
          // 监听接收消息
          socketService.onReceiveMessage((message) => {
            dispatch({ type: 'ADD_MESSAGE', payload: message });
          });
          
          // 监听接收私聊消息
          socketService.onReceivePrivateMessage((message) => {
            dispatch({ type: 'ADD_MESSAGE', payload: message });
            // 如果是新私聊房间，需要刷新房间列表
            fetchRooms();
          });
          
          // 监听用户上线
          socketService.onUserOnline((userId) => {
            addOnlineUser(userId);
          });
          
          // 监听用户下线
          socketService.onUserOffline((userId) => {
            removeOnlineUser(userId);
          });
        }).catch(error => {
          console.error('Socket连接失败:', error);
        });
      }
      
      // 获取聊天室列表
      fetchRooms();
    }
    
    return () => {
      // 组件卸载时断开Socket连接
      socketService.disconnect();
    };
  }, [isAuthenticated, user?._id, fetchRooms, user]); // 添加user到依赖项

  const value: ChatContextType = {
    ...state,
    fetchRooms,
    fetchMessages,
    setCurrentRoom,
    sendMessage,
    sendPrivateMessage,
    createRoom,
    joinRoom,
    joinRoomByCode,
    getRoomInviteCode,
    resetRoomInviteCode,
    leaveRoom,
    markRoomAsRead,
    getMessageReadStatus,
    addOnlineUser,
    removeOnlineUser,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// 使用聊天上下文的钩子
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat必须在ChatProvider内部使用');
  }
  return context;
};

export default ChatContext;