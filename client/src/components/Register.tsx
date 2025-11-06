import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import Input from '../components/Input';
import Button from '../components/Button';
import { validateRegisterForm } from '../utils/validation';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateRegisterForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register(formData.username, formData.email, formData.password);
      showToast('注册成功，请登录', 'success');
      navigate('/login');
    } catch (error) {
      showToast('注册失败，请稍后重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">注册</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            type="text"
            name="username"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            label="用户名"
            required
            autoFocus
          />
          
          <Input
            type="email"
            name="email"
            placeholder="请输入邮箱"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            label="邮箱"
            required
          />
          
          <Input
            type="password"
            name="password"
            placeholder="请输入密码"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            label="密码"
            required
          />
          
          <Input
            type="password"
            name="confirmPassword"
            placeholder="请确认密码"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            label="确认密码"
            required
          />
          
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="auth-button"
          >
            注册
          </Button>
        </form>
        
        <div className="auth-footer">
          <p>
            已有账号？ <Link to="/login">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;