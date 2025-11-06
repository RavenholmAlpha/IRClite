# IRClite API 文档

本文档描述了IRClite聊天应用的后端API接口。

## 基础信息

- 基础URL: `http://localhost:5000/api`
- 认证方式: JWT Token
- 数据格式: JSON

## 认证

### 用户注册

**请求**
```
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**响应**
```json
{
  "success": true,
  "message": "用户注册成功",
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string"
  }
}
```

### 用户登录

**请求**
```
POST /auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**响应**
```json
{
  "success": true,
  "message": "登录成功",
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string"
  }
}
```

## 用户管理

### 获取用户信息

**请求**
```
GET /users/profile
Authorization: Bearer {jwt_token}
```

**响应**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "createdAt": "timestamp"
  }
}
```

### 更新用户信息

**请求**
```
PUT /users/profile
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "username": "string",
  "email": "string"
}
```

**响应**
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string"
  }
}
```

### 搜索用户

**请求**
```
GET /users/search?q={query}
Authorization: Bearer {jwt_token}
```

**响应**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "username": "string",
      "email": "string",
      "avatar": "string"
    }
  ]
}
```

## 聊天室管理

### 创建聊天室

**请求**
```
POST /chats/rooms
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "isPrivate": false
}
```

**响应**
```json
{
  "success": true,
  "message": "聊天室创建成功",
  "room": {
    "id": "room_id",
    "name": "string",
    "description": "string",
    "isPrivate": false,
    "owner": "user_id",
    "createdAt": "timestamp"
  }
}
```

### 获取用户聊天室列表

**请求**
```
GET /chats/rooms
Authorization: Bearer {jwt_token}
```

**响应**
```json
{
  "success": true,
  "rooms": [
    {
      "id": "room_id",
      "name": "string",
      "description": "string",
      "isPrivate": false,
      "owner": "user_id",
      "createdAt": "timestamp",
      "lastMessage": {
        "content": "string",
        "sender": "user_id",
        "timestamp": "timestamp"
      }
    }
  ]
}
```

### 加入聊天室

**请求**
```
POST /chats/rooms/{room_id}/join
Authorization: Bearer {jwt_token}
```

**响应**
```json
{
  "success": true,
  "message": "成功加入聊天室"
}
```

### 离开聊天室

**请求**
```
POST /chats/rooms/{room_id}/leave
Authorization: Bearer {jwt_token}
```

**响应**
```json
{
  "success": true,
  "message": "成功离开聊天室"
}
```

## 消息管理

### 获取聊天室消息

**请求**
```
GET /chats/rooms/{room_id}/messages?page={page}&limit={limit}
Authorization: Bearer {jwt_token}
```

**响应**
```json
{
  "success": true,
  "messages": [
    {
      "id": "message_id",
      "content": "string",
      "sender": {
        "id": "user_id",
        "username": "string",
        "avatar": "string"
      },
      "room": "room_id",
      "type": "text|image",
      "timestamp": "timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 发送文本消息

**请求**
```
POST /chats/rooms/{room_id}/messages
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "content": "string",
  "type": "text"
}
```

**响应**
```json
{
  "success": true,
  "message": "消息发送成功",
  "data": {
    "id": "message_id",
    "content": "string",
    "sender": "user_id",
    "room": "room_id",
    "type": "text",
    "timestamp": "timestamp"
  }
}
```

## 文件上传

### 上传图片

**请求**
```
POST /upload/image
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

file: [image_file]
```

**响应**
```json
{
  "success": true,
  "message": "图片上传成功",
  "url": "string",
  "filename": "string"
}
```

## WebSocket 事件

### 连接

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_token_string'
  }
});
```

### 事件列表

#### 加入房间
```javascript
// 客户端发送
socket.emit('join-room', { roomId: 'room_id' });

// 服务器响应
socket.on('room-joined', { roomId: 'room_id' });
```

#### 离开房间
```javascript
// 客户端发送
socket.emit('leave-room', { roomId: 'room_id' });

// 服务器响应
socket.on('room-left', { roomId: 'room_id' });
```

#### 发送消息
```javascript
// 客户端发送
socket.emit('send-message', {
  roomId: 'room_id',
  content: 'message_content',
  type: 'text'
});
```

#### 接收消息
```javascript
// 服务器发送
socket.on('new-message', {
  id: 'message_id',
  content: 'message_content',
  sender: {
    id: 'user_id',
    username: 'string',
    avatar: 'string'
  },
  room: 'room_id',
  type: 'text',
  timestamp: 'timestamp'
});
```

#### 用户状态
```javascript
// 用户上线
socket.on('user-online', {
  userId: 'user_id',
  username: 'string'
});

// 用户下线
socket.on('user-offline', {
  userId: 'user_id',
  username: 'string'
});
```

#### 错误处理
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## 错误响应

所有API在出错时会返回以下格式的响应：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "错误代码"
}
```

### 常见错误代码

- `AUTH_REQUIRED`: 需要认证
- `AUTH_INVALID`: 认证无效
- `USER_NOT_FOUND`: 用户不存在
- `ROOM_NOT_FOUND`: 聊天室不存在
- `PERMISSION_DENIED`: 权限不足
- `VALIDATION_ERROR`: 数据验证失败
- `SERVER_ERROR`: 服务器内部错误