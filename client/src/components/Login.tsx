import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import Input from '../components/Input';
import Button from '../components/Button';
import { validateLoginForm } from '../utils/validation';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    
    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(formData.email, formData.password);
      showToast('登录成功', 'success');
      navigate('/chat');
    } catch (error) {
      showToast('登录失败，请检查邮箱和密码', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">登录</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            type="email"
            name="email"
            placeholder="请输入邮箱"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            label="邮箱"
            required
            autoFocus
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
          
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="auth-button"
          >
            登录
          </Button>
        </form>
        
        <div className="auth-footer">
          <p>
            还没有账号？ <Link to="/register">立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;