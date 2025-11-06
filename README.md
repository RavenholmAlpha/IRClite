# IRClite - 简单聊天室应用

IRClite 是一个基于 React + Node.js 的简单聊天室应用，支持群聊、私聊、图片发送和聊天记录功能。

## 功能特性

- 用户注册和登录
- 群聊和私聊（私聊本质上是2人群聊）
- 图片发送
- 聊天记录存储和推送
- WebSocket 实时通信

## 技术栈

- 前端：React
- 后端：Node.js + Express + Socket.io
- 数据库：MongoDB
- 认证：JWT

## 项目结构

```
IRClite/
├── client/          # React 前端应用
├── server/          # Node.js 后端应用
└── README.md        # 项目说明文档
```

## 快速开始

### 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 运行项目

```bash
# 启动后端服务器（在 server 目录下）
npm run dev

# 启动前端应用（在 client 目录下）
npm start
```

## 开发计划

- [x] 项目基本结构
- [ ] 后端 API 开发
- [ ] 用户认证系统
- [ ] WebSocket 聊天功能
- [ ] 前端界面开发
- [ ] 图片上传功能
- [ ] 聊天记录功能

## 贡献

欢迎提交 Issue 和 Pull Request！