# IRClite - 简单聊天室应用

IRClite 是一个基于 React + Node.js 的简单聊天室应用，支持群聊、私聊、图片发送和聊天记录功能。现已支持Web浏览器和桌面应用两种使用方式。

## 功能特性

- 用户注册和登录
- 群聊和私聊（私聊本质上是2人群聊）
- 图片发送
- 聊天记录存储和推送
- WebSocket 实时通信
- 桌面应用支持（使用Tauri技术）

## 技术栈

- 前端：React + TypeScript
- 后端：Node.js + Express + Socket.io
- 数据库：MongoDB
- 认证：JWT
- 桌面应用：Tauri + Rust

## 项目结构

```
IRClite/
├── client/          # React 前端应用
│   ├── src/         # 前端源代码
│   └── src-tauri/   # Tauri 桌面应用配置
├── server/          # Node.js 后端应用
├── docs/            # 项目文档
└── README.md        # 项目说明文档
```

## 快速开始

### Web版本

#### 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

#### 运行项目

```bash
# 启动后端服务器（在 server 目录下）
npm start

# 启动前端应用（在 client 目录下）
npm start
```

### 桌面应用版本

#### 前置要求

- 安装 [Rust](https://rustup.rs/)
- 安装 [Node.js](https://nodejs.org/) (v16+)

#### 安装和运行

```bash
# 克隆仓库
git clone https://github.com/RavenholmAlpha/IRClite.git

# 进入客户端目录
cd IRClite/client

# 安装依赖
npm install

# 运行开发环境
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

构建完成后，可执行文件和安装包将位于：
- Windows: `client/src-tauri/target/release/bundle/msi/IRClite_0.1.0_x64_en-US.msi`
- Windows (NSIS): `client/src-tauri/target/release/bundle/nsis/IRClite_0.1.0_x64-setup.exe`

## API文档

详细的API文档请参考 [API文档](./docs/API.md)

## 开发指南

详细的开发指南请参考 [开发指南](./docs/DEVELOPMENT.md)

## 部署指南

详细的部署指南请参考 [部署指南](./docs/DEPLOYMENT.md)

## 功能演示

- 用户注册和登录
- 创建和加入聊天室
- 发送文本消息
- 发送图片
- 查看聊天记录
- 桌面应用通知

## 开发进度

- [x] 项目基本结构
- [x] 后端 API 开发
- [x] 用户认证系统
- [x] WebSocket 聊天功能
- [x] 前端界面开发
- [x] 图片上传功能
- [x] 聊天记录功能
- [x] Tauri桌面应用支持

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License