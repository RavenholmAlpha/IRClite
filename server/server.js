const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 中间件
app.use(cors({
  origin: ["http://localhost:3001", "http://localhost:3002"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/irclite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB 连接成功'))
.catch(err => console.error('MongoDB 连接失败:', err));

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const uploadRoutes = require('./routes/upload');
const friendsRoutes = require('./routes/friends');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/friends', friendsRoutes);

// 存储在线用户
const onlineUsers = {};

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  // 用户登录
  socket.on('user_login', async (userId) => {
    try {
      // 更新用户在线状态
      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, { isOnline: true });
      
      onlineUsers[userId] = socket.id;
      socket.userId = userId;
      console.log(`用户 ${userId} 已上线`);
      
      // 通知其他用户该用户上线
      socket.broadcast.emit('user_online', userId);
    } catch (error) {
      console.error('用户登录处理错误:', error);
    }
  });

  // 加入聊天室
  socket.on('join_room', (roomId) => {
    if (!socket.userId) {
      console.log('未登录用户尝试加入房间:', roomId);
      return;
    }
    
    socket.join(roomId);
    console.log(`用户 ${socket.userId} 加入房间 ${roomId}`);
  });

  // 发送消息
  socket.on('send_message', async (data) => {
    if (!socket.userId) {
      console.log('未登录用户尝试发送消息');
      return;
    }
    
    const { roomId, message, type = 'text' } = data;
    
    // 保存消息到数据库
    try {
      const Message = require('./models/Message');
      const User = require('./models/User');
      
      // 获取发送者用户信息
      const sender = await User.findById(socket.userId);
      
      const newMessage = new Message({
        room: roomId,
        sender: socket.userId,
        content: message,
        type: type,
        timestamp: new Date()
      });
      
      await newMessage.save();
      
      // 向房间内所有用户广播消息，包含发送者信息
      io.to(roomId).emit('receive_message', {
        _id: newMessage._id,
        room: roomId,
        sender: {
          _id: sender._id,
          username: sender.username,
          avatar: sender.avatar
        },
        content: message,
        type: type,
        timestamp: newMessage.timestamp,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  });

  // 私聊（本质上是2人群聊）
  socket.on('private_message', async (data) => {
    if (!socket.userId) {
      console.log('未登录用户尝试发送私聊消息');
      return;
    }
    
    const { recipientId, message, type = 'text' } = data;
    
    try {
      const Room = require('./models/Room');
      const Message = require('./models/Message');
      const User = require('./models/User');
      
      // 获取发送者用户信息
      const sender = await User.findById(socket.userId);
      
      // 查找或创建私聊房间
      let room = await Room.findOne({
        type: 'direct',
        participants: { $all: [socket.userId, recipientId], $size: 2 }
      });
      
      if (!room) {
        // 获取发送者和接收者的用户名
        const sender = await User.findById(socket.userId);
        const recipient = await User.findById(recipientId);
        
        room = new Room({
          name: `${sender.username} 和 ${recipient.username} 的私聊`,
          type: 'direct',
          participants: [socket.userId, recipientId]
        });
        await room.save();
      }
      
      // 保存消息
      const newMessage = new Message({
        room: room._id,
        sender: socket.userId,
        content: message,
        type: type,
        timestamp: new Date()
      });
      
      await newMessage.save();
      
      // 构建消息对象，包含发送者信息
      const messageData = {
        _id: newMessage._id,
        room: room._id,
        sender: {
          _id: sender._id,
          username: sender.username,
          avatar: sender.avatar
        },
        content: message,
        type: type,
        timestamp: newMessage.timestamp,
        createdAt: newMessage.createdAt
      };
      
      // 向双方发送消息
      const recipientSocketId = onlineUsers[recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_private_message', messageData);
      }
      
      // 也发送给自己
      socket.emit('receive_private_message', messageData);
    } catch (error) {
      console.error('发送私聊消息失败:', error);
    }
  });

  // 用户断开连接
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        // 更新用户离线状态
        const User = require('./models/User');
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false, 
          lastSeen: new Date() 
        });
        
        delete onlineUsers[socket.userId];
        console.log(`用户 ${socket.userId} 已下线`);
        
        // 通知其他用户该用户下线
        socket.broadcast.emit('user_offline', socket.userId);
      }
    } catch (error) {
      console.error('用户断开连接处理错误:', error);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});