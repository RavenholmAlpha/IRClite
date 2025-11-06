require('dotenv').config();
const axios = require('axios');

// 配置API基础URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// 测试用户凭据
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser'
};

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 存储认证token
let authToken = '';

// 创建测试用户
async function createTestUser() {
  try {
    const response = await api.post('/auth/register', testUser);
    console.log('创建用户成功');
    return response.data;
  } catch (error) {
    // 如果用户已存在，直接登录
    if (error.response?.status === 400 && error.response?.data?.message?.includes('已存在')) {
      console.log('用户已存在，直接登录');
      return null;
    }
    console.error('创建用户失败:', error.response?.data || error.message);
    throw error;
  }
}

// 登录获取token
async function login() {
  try {
    const response = await api.post('/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    authToken = response.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('登录成功');
    return response.data.user;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 创建测试聊天室
async function createTestRoom() {
  try {
    console.log('准备创建聊天室...');
    
    const roomData = {
      name: '群聊代码测试房间',
      type: 'public',
      description: '用于测试群聊代码功能的房间'
    };
    
    console.log('发送创建聊天室请求，数据:', roomData);
    
    const response = await api.post('/chats/rooms', roomData);
    console.log('创建聊天室响应状态:', response.status);
    console.log('创建聊天室响应数据:', response.data);
    
    if (!response.data) {
      throw new Error('创建聊天室响应数据为空');
    }
    
    console.log('创建聊天室成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('创建聊天室详细错误:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
}

// 获取聊天室的群聊代码
async function getInviteCode(roomId) {
  try {
    const response = await api.get(`/chats/rooms/${roomId}/invite-code`);
    console.log('获取群聊代码成功:', response.data.inviteCode);
    return response.data.inviteCode;
  } catch (error) {
    console.error('获取群聊代码失败:', error.response?.data || error.message);
    throw error;
  }
}

// 通过群聊代码加入聊天室
async function joinRoomByCode(inviteCode) {
  try {
    const response = await api.post('/chats/rooms/join-by-code', { inviteCode });
    console.log('通过群聊代码加入聊天室成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('通过群聊代码加入聊天室失败:', error.response?.data || error.message);
    throw error;
  }
}

// 重置群聊代码
async function resetInviteCode(roomId) {
  try {
    const response = await api.post(`/chats/rooms/${roomId}/reset-invite-code`);
    console.log('重置群聊代码成功:', response.data.inviteCode);
    return response.data.inviteCode;
  } catch (error) {
    console.error('重置群聊代码失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试函数
async function testInviteCodeFeature() {
  try {
    console.log('开始测试群聊代码功能...\n');
    
    // 0. 创建测试用户（如果不存在）
    await createTestUser();
    
    // 1. 登录
    const user = await login();
    console.log('用户信息:', user);
    
    // 2. 创建测试聊天室
    const room = await createTestRoom();
    console.log('创建的聊天室:', room);
    
    // 3. 获取群聊代码
    const inviteCode = await getInviteCode(room._id);
    console.log('群聊代码:', inviteCode);
    
    // 4. 测试通过群聊代码加入聊天室
    await joinRoomByCode(inviteCode);
    
    // 5. 重置群聊代码
    const newInviteCode = await resetInviteCode(room._id);
    console.log('新的群聊代码:', newInviteCode);
    
    // 6. 使用新代码再次尝试加入
    await joinRoomByCode(newInviteCode);
    
    console.log('\n所有测试通过！群聊代码功能正常工作。');
  } catch (error) {
    console.error('\n测试失败:', error.message);
  }
}

// 运行测试
testInviteCodeFeature();