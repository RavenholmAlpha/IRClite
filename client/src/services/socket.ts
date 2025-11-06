import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  // 连接到服务器
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Socket连接成功');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket连接错误:', error);
        reject(error);
      });
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 用户登录
  userLogin(userId: string): void {
    if (this.socket) {
      this.socket.emit('user_login', userId);
    }
  }

  // 加入聊天室
  joinRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('join_room', roomId);
    }
  }

  // 发送消息
  sendMessage(roomId: string, message: string, type: 'text' | 'image' = 'text'): void {
    if (this.socket) {
      this.socket.emit('send_message', {
        roomId,
        message,
        type
      });
    }
  }

  // 发送私聊消息
  sendPrivateMessage(recipientId: string, message: string, type: 'text' | 'image' = 'text'): void {
    if (this.socket) {
      this.socket.emit('private_message', {
        recipientId,
        message,
        type
      });
    }
  }

  // 监听接收消息
  onReceiveMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  // 监听接收私聊消息
  onReceivePrivateMessage(callback: (message: Message & { roomId: string }) => void): void {
    if (this.socket) {
      this.socket.on('receive_private_message', callback);
    }
  }

  // 监听用户上线
  onUserOnline(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('user_online', callback);
    }
  }

  // 监听用户下线
  onUserOffline(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('user_offline', callback);
    }
  }

  // 移除事件监听器
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // 获取当前socket实例
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 导出单例实例
export const socketService = new SocketService();

export default socketService;