# IRClite 部署指南

本文档提供了IRClite聊天应用的详细部署指南，包括Web版本和桌面应用的部署方法。

## Web应用部署

### 服务器要求

- Ubuntu 20.04 LTS 或 CentOS 8+
- Node.js 16+ 
- MongoDB 4.4+
- Nginx
- PM2 (进程管理器)
- SSL证书（推荐）

### 部署步骤

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要的工具
sudo apt install -y curl wget git build-essential

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v

# 安装PM2
sudo npm install -g pm2

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2. 应用部署

```bash
# 创建应用目录
sudo mkdir -p /var/www/irclite
sudo chown $USER:$USER /var/www/irclite

# 克隆项目
cd /var/www/irclite
git clone https://github.com/RavenholmAlpha/IRClite.git .

# 安装后端依赖
cd server
npm install --production

# 安装前端依赖并构建
cd ../client
npm install
npm run build

# 配置环境变量
cd ../server
sudo nano .env
```

#### 3. 环境变量配置

在`server`目录下创建`.env`文件：

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/irclite
DB_NAME=irclite

# JWT配置
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# 服务器配置
PORT=5000
NODE_ENV=production

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# 域名配置（如果使用HTTPS）
DOMAIN=yourdomain.com
```

#### 4. PM2配置

创建PM2配置文件`ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'irclite-server',
    script: 'server.js',
    cwd: '/var/www/irclite/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

启动应用：

```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置PM2开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### 5. Nginx配置

创建Nginx配置文件`/etc/nginx/sites-available/irclite`：

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 前端静态文件
    location / {
        root /var/www/irclite/client/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io代理
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/irclite /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

#### 6. SSL证书配置（使用Let's Encrypt）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Docker部署

#### Dockerfile

创建`Dockerfile`：

```dockerfile
# 多阶段构建
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package.json文件
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# 安装依赖
RUN cd server && npm ci --only=production
RUN cd client && npm ci

# 复制源代码
COPY server/ ./server/
COPY client/ ./client/

# 构建前端
RUN cd client && npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制后端代码和依赖
COPY --from=builder /app/server .
COPY --from=builder /app/client/build ./client/build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 设置文件权限
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["node", "server.js"]
```

#### docker-compose.yml

创建`docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/irclite
      - JWT_SECRET=your_secure_jwt_secret_key_here
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo_data:
```

部署命令：

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 桌面应用部署

### Windows

#### 构建安装包

```bash
# 进入客户端目录
cd client

# 构建Windows应用
npm run tauri:build
```

构建完成后，安装包位于：
- MSI安装包：`src-tauri/target/release/bundle/msi/IRClite_0.1.0_x64_en-US.msi`
- NSIS安装程序：`src-tauri/target/release/bundle/nsis/IRClite_0.1.0_x64-setup.exe`

#### 代码签名（可选）

为了在Windows上避免安全警告，可以对应用进行代码签名：

1. 获取代码签名证书
2. 配置`src-tauri/tauri.conf.json`：

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERTIFICATE_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

#### 自动更新

Tauri支持自动更新功能，配置步骤：

1. 在`src-tauri/Cargo.toml`中添加依赖：

```toml
[dependencies]
tauri = { version = "1.0", features = ["updater"] }
```

2. 在`src-tauri/tauri.conf.json`中配置更新端点：

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.ravenholmalpha.irclite",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.myapp.com/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

3. 设置更新服务器，提供更新信息和下载链接

### macOS

#### 构建应用

```bash
# 进入客户端目录
cd client

# 构建macOS应用
npm run tauri:build
```

构建完成后，应用位于：
- `src-tauri/target/release/bundle/macos/IRClite.app`
- DMG安装包：`src-tauri/target/release/bundle/dmg/IRClite_0.1.0_x64.dmg`

#### 代码签名和公证

1. 获取Apple开发者证书
2. 配置`src-tauri/tauri.conf.json`：

```json
{
  "bundle": {
    "macOS": {
      "entitlements": null,
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

3. 公证应用（macOS 10.14.5+需要）

### Linux

#### 构建应用

```bash
# 进入客户端目录
cd client

# 构建Linux应用
npm run tauri:build
```

构建完成后，安装包位于：
- DEB包：`src-tauri/target/release/bundle/deb/IRClite_0.1.0_amd64.deb`
- AppImage：`src-tauri/target/release/bundle/appimage/IRClite_0.1.0_amd64.AppImage`

#### 创建仓库（可选）

可以创建APT仓库来分发DEB包：

1. 设置 reprepro
2. 添加包到仓库
3. 配置用户的APT源

## 监控和维护

### 日志管理

```bash
# 查看PM2日志
pm2 logs

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看MongoDB日志
sudo tail -f /var/log/mongodb/mongod.log
```

### 性能监控

使用PM2监控：

```bash
# 查看应用状态
pm2 status

# 查看详细信息
pm2 show irclite-server

# 监控资源使用
pm2 monit
```

### 备份策略

1. 数据库备份：

```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db irclite --out /backup/mongodb_$DATE
tar -czf /backup/mongodb_$DATE.tar.gz /backup/mongodb_$DATE
rm -rf /backup/mongodb_$DATE
```

2. 文件备份：

```bash
# 备份上传文件
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/uploads_$DATE.tar.gz /var/www/irclite/server/uploads
```

3. 自动备份（添加到crontab）：

```bash
# 每天凌晨2点备份数据库
0 2 * * * /path/to/backup_db.sh

# 每周日凌晨3点备份上传文件
0 3 * * 0 /path/to/backup_uploads.sh
```

## 故障排除

### 常见问题

1. **应用无法启动**
   - 检查环境变量配置
   - 查看PM2日志：`pm2 logs irclite-server`
   - 确认MongoDB服务运行状态：`sudo systemctl status mongod`

2. **WebSocket连接失败**
   - 检查Nginx配置中的Socket.io代理设置
   - 确认防火墙设置允许WebSocket连接

3. **文件上传失败**
   - 检查上传目录权限
   - 确认Nginx配置中的`client_max_body_size`设置

4. **桌面应用无法连接服务器**
   - 检查API URL配置
   - 确认服务器防火墙设置

### 性能优化

1. **数据库优化**
   - 创建适当的索引
   - 定期清理过期数据

2. **前端优化**
   - 启用代码分割
   - 优化资源加载

3. **服务器优化**
   - 启用Gzip压缩
   - 配置缓存策略

## 安全建议

1. 定期更新依赖包
2. 使用强密码和安全的JWT密钥
3. 启用HTTPS
4. 限制文件上传类型和大小
5. 实施速率限制
6. 定期备份数据
7. 监控异常活动