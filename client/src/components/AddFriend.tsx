import React, { useState, useEffect } from 'react';
import { User, FriendRequest } from '../types';
import { getUsers, sendFriendRequest, getFriendRequests, respondToFriendRequest } from '../services/friends';
import './AddFriend.css';

const AddFriend: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('search');

  // 搜索用户
  const handleSearchUsers = async (query: string) => {
    if (!query.trim()) {
      // 如果搜索词为空，获取所有用户
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        setError('获取用户列表失败');
      }
      return;
    }

    setIsSearching(true);
    try {
      const usersData = await getUsers(query);
      setUsers(usersData);
    } catch (err) {
      setError('搜索用户失败');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, requestsData] = await Promise.all([
          getUsers(),
          getFriendRequests()
        ]);
        setUsers(usersData);
        setFriendRequests(requestsData);
        setLoading(false);
      } catch (err) {
        setError('获取数据失败');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 当搜索词变化时，调用搜索API
  useEffect(() => {
    if (activeTab === 'search') {
      const timeoutId = setTimeout(() => {
        handleSearchUsers(searchTerm);
      }, 300); // 添加300ms的延迟，避免频繁请求

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, activeTab]);

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setSuccessMessage('好友请求已发送');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // 重新获取用户列表以更新状态
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
    } catch (err) {
      setError('发送好友请求失败');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    try {
      await respondToFriendRequest(requestId, accept);
      setSuccessMessage(accept ? '已接受好友请求' : '已拒绝好友请求');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // 重新获取好友请求列表
      const updatedRequests = await getFriendRequests();
      setFriendRequests(updatedRequests);
    } catch (err) {
      setError('处理好友请求失败');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="add-friend">
      <h2>添加好友</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          搜索用户
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          好友请求 {friendRequests.length > 0 && `(${friendRequests.length})`}
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="搜索用户名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {isSearching && <div className="searching-indicator">搜索中...</div>}
          </div>
          
          {users.length === 0 && !isSearching ? (
            <p className="no-results">未找到匹配的用户</p>
          ) : (
            <ul className="users-list">
              {users.map(user => (
                <li key={user._id} className="user-item">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <div className="avatar-placeholder">{user.username.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="user-info">
                    <h3>{user.username}</h3>
                    <span className={`status ${user.isOnline ? 'online' : 'offline'}`}>
                      {user.isOnline ? '在线' : '离线'}
                    </span>
                  </div>
                  <div className="user-actions">
                    <button
                      className="add-friend-btn"
                      onClick={() => handleSendFriendRequest(user._id)}
                    >
                      添加好友
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-section">
          {friendRequests.length === 0 ? (
            <p className="no-requests">暂无好友请求</p>
          ) : (
            <ul className="requests-list">
              {friendRequests.map(request => (
                <li key={request._id} className="request-item">
                  <div className="request-avatar">
                    {request.sender.avatar ? (
                      <img src={request.sender.avatar} alt={request.sender.username} />
                    ) : (
                      <div className="avatar-placeholder">{request.sender.username.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="request-info">
                    <h3>{request.sender.username}</h3>
                    <span className="request-time">
                      {new Date(request.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleRespondToRequest(request._id, true)}
                    >
                      接受
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleRespondToRequest(request._id, false)}
                    >
                      拒绝
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AddFriend;