require('dotenv').config();
const axios = require('axios');

// 配置API基础URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// 测试用户凭据
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

// 创建测试用户
async function createTestUser() {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('测试用户创建成功');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.message.includes('邮箱已存在')) {
      console.log('用户已存在，直接登录');
      return login();
    }
    console.error('创建用户失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 用户登录
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('登录成功');
    console.log('用户信息:', response.data.user);
    return response.data.token;
  } catch (error) {
    console.error('登录失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 创建聊天室
async function createChatRoom(token) {
  try {
    console.log('准备创建聊天室...');
    
    const response = await axios.post(`${API_URL}/chats/rooms`, 
      { 
        name: '测试聊天室',
        description: '这是一个测试聊天室',
        participants: []
      }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('创建聊天室响应:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('创建聊天室详细错误:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 获取群聊代码
async function getInviteCode(token, roomId) {
  try {
    const response = await axios.get(`${API_URL}/chats/rooms/${roomId}/invite-code`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取群聊代码成功:', response.data);
    return response.data.data.inviteCode;
  } catch (error) {
    console.error('获取群聊代码失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 重置群聊代码
async function resetInviteCode(token, roomId) {
  try {
    const response = await axios.post(`${API_URL}/chats/rooms/${roomId}/reset-invite-code`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('重置群聊代码成功:', response.data);
    return response.data.data.inviteCode;
  } catch (error) {
    console.error('重置群聊代码失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 通过群聊代码加入聊天室
async function joinRoomByCode(token, inviteCode) {
  try {
    const response = await axios.post(`${API_URL}/chats/rooms/join-by-code`, 
      { inviteCode }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('通过群聊代码加入聊天室成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('通过群聊代码加入聊天室失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 测试流程
async function testInviteCodeFeature() {
  try {
    console.log('开始测试群聊代码功能...');
    
    // 1. 创建测试用户并登录
    await createTestUser();
    const token = await login();
    
    // 2. 创建聊天室
    const room = await createChatRoom(token);
    
    // 3. 获取群聊代码
    const inviteCode = await getInviteCode(token, room._id);
    
    // 4. 重置群聊代码
    const newInviteCode = await resetInviteCode(token, room._id);
    
    // 5. 创建第二个用户并登录
    const testUser2 = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123'
    };
    
    try {
      await axios.post(`${API_URL}/auth/register`, testUser2);
    } catch (error) {
      // 用户可能已存在，忽略错误
    }
    
    const loginResponse2 = await axios.post(`${API_URL}/auth/login`, {
      email: testUser2.email,
      password: testUser2.password
    });
    
    const token2 = loginResponse2.data.token;
    
    // 6. 使用第二个用户通过群聊代码加入聊天室
    await joinRoomByCode(token2, newInviteCode);
    
    console.log('群聊代码功能测试完成！');
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 运行测试
testInviteCodeFeature();