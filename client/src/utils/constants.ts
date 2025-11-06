// API配置
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Socket配置
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language'
};

// 聊天室类型
export const ROOM_TYPES = {
  PRIVATE: 'private',
  GROUP: 'group'
};

// 消息类型
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
};

// 文件上传限制
export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

// 主题配置
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// 语言配置
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US'
};

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接错误，请检查您的网络设置',
  AUTH_ERROR: '身份验证失败，请重新登录',
  INVALID_CREDENTIALS: '用户名或密码错误',
  USER_EXISTS: '用户名已存在',
  ROOM_NOT_FOUND: '聊天室不存在',
  MESSAGE_SEND_FAILED: '消息发送失败',
  FILE_UPLOAD_FAILED: '文件上传失败',
  FILE_TOO_LARGE: '文件大小超过限制',
  INVALID_FILE_TYPE: '不支持的文件类型',
  SERVER_ERROR: '服务器错误，请稍后重试'
};

// 成功消息
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  REGISTER_SUCCESS: '注册成功',
  LOGOUT_SUCCESS: '已成功退出登录',
  MESSAGE_SENT: '消息已发送',
  FILE_UPLOADED: '文件上传成功',
  PROFILE_UPDATED: '个人资料更新成功',
  ROOM_CREATED: '聊天室创建成功',
  ROOM_JOINED: '已加入聊天室',
  ROOM_LEFT: '已离开聊天室'
};

// 默认头像URL
export const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=random';

// 聊天室默认名称
export const DEFAULT_ROOM_NAMES = {
  PRIVATE: '私聊',
  GROUP: '群聊'
};

// 系统消息前缀
export const SYSTEM_MESSAGE_PREFIX = {
  USER_JOINED: '加入了聊天室',
  USER_LEFT: '离开了聊天室',
  ROOM_CREATED: '创建了聊天室',
  USER_KICKED: '被移出聊天室',
  USER_ADDED: '被添加到聊天室'
};