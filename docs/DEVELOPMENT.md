# IRClite 开发指南

本文档为开发者提供了参与IRClite项目开发的详细指南。

## 开发环境设置

### 前置要求

- Node.js (v16+)
- npm 或 yarn
- MongoDB
- Git
- Rust (仅桌面应用开发)

### 克隆仓库

```bash
git clone https://github.com/RavenholmAlpha/IRClite.git
cd IRClite
```

### 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 环境配置

#### 后端环境配置

在 `server` 目录下创建 `.env` 文件：

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/irclite
DB_NAME=irclite

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# 服务器配置
PORT=5000
NODE_ENV=development

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

#### 前端环境配置

在 `client` 目录下创建 `.env` 文件：

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 项目架构

### 后端架构

```
server/
├── middleware/       # 中间件
│   └── auth.js      # JWT认证中间件
├── models/          # 数据模型
│   ├── User.js      # 用户模型
│   ├── Room.js      # 聊天室模型
│   └── Message.js   # 消息模型
├── routes/          # API路由
│   ├── auth.js      # 认证路由
│   ├── users.js     # 用户路由
│   ├── chats.js     # 聊天路由
│   └── upload.js    # 文件上传路由
├── utils/           # 工具函数
├── uploads/         # 文件上传目录
└── server.js        # 服务器入口文件
```

### 前端架构

```
client/
├── public/          # 静态资源
├── src/
│   ├── components/  # React组件
│   │   ├── Auth/    # 认证相关组件
│   │   ├── Chat/    # 聊天相关组件
│   │   └── Common/  # 通用组件
│   ├── context/     # React Context
│   ├── services/    # API服务
│   ├── types/       # TypeScript类型定义
│   ├── utils/       # 工具函数
│   ├── App.tsx      # 应用主组件
│   └── index.tsx    # 应用入口
├── src-tauri/       # Tauri桌面应用配置
└── package.json     # 项目依赖和脚本
```

## 开发流程

### 启动开发服务器

1. 启动MongoDB数据库
2. 启动后端服务器：
   ```bash
   cd server
   npm start
   ```
3. 启动前端开发服务器：
   ```bash
   cd client
   npm start
   ```

### 桌面应用开发

```bash
cd client

# 运行开发环境
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

### 代码规范

- 使用ESLint和Prettier进行代码格式化
- 遵循React Hooks规范
- 使用TypeScript进行类型检查
- 提交前运行测试和代码检查

### Git工作流

1. 从main分支创建功能分支
2. 完成开发并提交代码
3. 创建Pull Request到main分支
4. 代码审查通过后合并

## 核心功能实现

### 用户认证

#### JWT认证流程

1. 用户登录时，服务器验证凭据
2. 验证成功后，生成JWT令牌
3. 客户端存储令牌（localStorage）
4. 后续请求携带令牌进行认证
5. 服务器验证令牌有效性

#### 认证中间件

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '访问被拒绝，需要认证令牌' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: '令牌无效' });
  }
};

module.exports = auth;
```

### WebSocket实时通信

#### Socket.io事件处理

```javascript
// server.js - Socket.io设置
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.user.id;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`用户 ${socket.userId} 已连接`);
  
  // 加入房间
  socket.on('join-room', (data) => {
    socket.join(data.roomId);
    socket.to(data.roomId).emit('user-joined', { userId: socket.userId });
  });
  
  // 发送消息
  socket.on('send-message', async (data) => {
    try {
      // 保存消息到数据库
      const message = new Message({
        content: data.content,
        sender: socket.userId,
        room: data.roomId,
        type: data.type || 'text'
      });
      
      await message.save();
      
      // 填充发送者信息
      await message.populate('sender', 'username avatar');
      
      // 广播消息到房间
      io.to(data.roomId).emit('new-message', message);
    } catch (error) {
      socket.emit('error', { message: '发送消息失败' });
    }
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户 ${socket.userId} 已断开连接`);
  });
});
```

### 前端状态管理

#### React Context设置

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '../types/user';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 使用Context的Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### Socket.io客户端集成

```typescript
// services/socketService.ts
import io, { Socket } from 'socket.io-client';
import { Message } from '../types/message';

class SocketService {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });
    
    this.socket.on('connect', () => {
      console.log('已连接到服务器');
    });
    
    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
    });
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join-room', { roomId });
    }
  }
  
  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave-room', { roomId });
    }
  }
  
  sendMessage(roomId: string, content: string, type: string = 'text') {
    if (this.socket) {
      this.socket.emit('send-message', { roomId, content, type });
    }
  }
  
  onNewMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }
  
  offNewMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.off('new-message', callback);
    }
  }
}

export default new SocketService();
```

## 测试

### 单元测试

使用Jest进行单元测试：

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- auth.test.js

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

### 集成测试

使用Supertest进行API集成测试：

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('Authentication', () => {
  test('用户注册', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
  
  test('用户登录', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

## 部署

### 生产环境配置

1. 设置环境变量
2. 构建前端应用
3. 配置反向代理（Nginx）
4. 设置PM2进程管理
5. 配置SSL证书

详细部署指南请参考 [部署指南](./DEPLOYMENT.md)

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 常见问题

### Q: 如何添加新的API端点？

A: 在`server/routes`目录下创建新的路由文件，然后在`server.js`中引入并使用该路由。

### Q: 如何添加新的前端页面？

A: 在`client/src/components`目录下创建新的组件，然后在`App.tsx`中添加路由配置。

### Q: 如何自定义桌面应用？

A: 修改`client/src-tauri/tauri.conf.json`文件中的配置，如窗口大小、图标等。

### Q: 如何处理图片上传？

A: 使用`multer`中间件处理文件上传，详细实现请参考`server/routes/upload.js`。