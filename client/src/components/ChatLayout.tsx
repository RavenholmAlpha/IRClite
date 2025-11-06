import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from './ToastContainer';
import Login from './Login';
import Register from './Register';
import ChatRoomList from './ChatRoomList';
import FriendsList from './FriendsList';
import AddFriend from './AddFriend';
import Chat from './Chat';
import Button from './Button';
import './ChatLayout.css';

const ChatLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
  };

  // 根据当前路径确定侧边栏内容
  const getSidebarContent = () => {
    const pathname = location.pathname;
    
    if (pathname.startsWith('/friends')) {
      if (pathname === '/friends/add') {
        return <AddFriend />;
      }
      return <FriendsList />;
    }
    
    return <ChatRoomList />;
  };

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <div className="auth-layout">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="chat-layout">
        <div className="chat-layout-header">
          <div className="chat-layout-header-left">
            <Button
              variant="ghost"
              size="small"
              onClick={toggleSidebar}
              className="sidebar-toggle"
            >
              {sidebarOpen ? '◀' : '▶'}
            </Button>
            <h1 className="app-title">IRClite</h1>
          </div>
          <div className="chat-layout-header-right">
            <span className="user-info">欢迎, {user?.username}</span>
            <Button
              variant="ghost"
              size="small"
              onClick={handleLogout}
            >
              退出
            </Button>
          </div>
        </div>
        
        <div className="chat-layout-body">
          {sidebarOpen && (
            <div className="chat-layout-sidebar">
              <div className="sidebar-nav">
                <Button
                  variant={location.pathname.startsWith('/chat') ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => navigate('/chat')}
                  className="nav-button"
                >
                  聊天室
                </Button>
                <Button
                  variant={location.pathname.startsWith('/friends') ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => navigate('/friends')}
                  className="nav-button"
                >
                  好友
                </Button>
                {location.pathname.startsWith('/friends') && (
                  <Button
                    variant={location.pathname === '/friends/add' ? 'primary' : 'ghost'}
                    size="small"
                    onClick={() => navigate('/friends/add')}
                    className="nav-button nav-sub"
                  >
                    添加好友
                  </Button>
                )}
              </div>
              <div className="sidebar-content">
                {getSidebarContent()}
              </div>
            </div>
          )}
          
          <div className="chat-layout-main">
            <Routes>
              <Route path="/chat" element={
                <div className="chat-welcome">
                  <h2>欢迎使用 IRClite</h2>
                  <p>选择一个聊天室开始聊天</p>
                </div>
              } />
              <Route path="/chat/:roomId" element={<Chat />} />
              <Route path="/friends" element={<FriendsList />} />
              <Route path="/friends/add" element={<AddFriend />} />
              <Route path="*" element={<Navigate to="/chat" />} />
            </Routes>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};

export default ChatLayout;