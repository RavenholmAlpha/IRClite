import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getFriends, deleteFriend, getOrCreateDirectMessage } from '../services/friends';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import './FriendsList.css';

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentRoom } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendsData = await getFriends();
        setFriends(friendsData);
        setLoading(false);
      } catch (err) {
        setError('获取好友列表失败');
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const handleDeleteFriend = async (friendId: string) => {
    if (window.confirm('确定要删除这个好友吗？')) {
      try {
        await deleteFriend(friendId);
        setFriends(friends.filter(friend => friend._id !== friendId));
      } catch (err) {
        setError('删除好友失败');
      }
    }
  };

  const handleStartDirectMessage = async (friend: User) => {
    try {
      const room = await getOrCreateDirectMessage(friend._id);
      setCurrentRoom(room);
      navigate(`/chat/${room._id}`);
    } catch (err) {
      setError('创建私聊房间失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="friends-list">
      <h2>好友列表</h2>
      {friends.length === 0 ? (
        <p className="no-friends">暂无好友</p>
      ) : (
        <ul className="friends-container">
          {friends.map(friend => (
            <li key={friend._id} className="friend-item">
              <div 
                className="friend-avatar"
                onClick={() => handleStartDirectMessage(friend)}
                title="点击开始聊天"
              >
                {friend.avatar ? (
                  <img src={friend.avatar} alt={friend.username} />
                ) : (
                  <div className="avatar-placeholder">{friend.username.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="friend-info">
                <h3>{friend.username}</h3>
                <span className={`status ${friend.isOnline ? 'online' : 'offline'}`}>
                  {friend.isOnline ? '在线' : '离线'}
                </span>
              </div>
              <div className="friend-actions">
                <button 
                  className="message-btn"
                  onClick={() => handleStartDirectMessage(friend)}
                  title="发送消息"
                >
                  💬
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteFriend(friend._id)}
                  title="删除好友"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;