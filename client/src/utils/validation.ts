import { REGEX } from './constants';

// 验证邮箱
export const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) {
    return { isValid: false, message: '请输入邮箱地址' };
  }
  
  if (!REGEX.EMAIL.test(email)) {
    return { isValid: false, message: '请输入有效的邮箱地址' };
  }
  
  return { isValid: true, message: '' };
};

// 验证用户名
export const validateUsername = (username: string): { isValid: boolean; message: string } => {
  if (!username) {
    return { isValid: false, message: '请输入用户名' };
  }
  
  if (username.length < 3) {
    return { isValid: false, message: '用户名至少需要3个字符' };
  }
  
  if (username.length > 20) {
    return { isValid: false, message: '用户名不能超过20个字符' };
  }
  
  if (!REGEX.USERNAME.test(username)) {
    return { isValid: false, message: '用户名只能包含字母、数字和下划线' };
  }
  
  return { isValid: true, message: '' };
};

// 验证密码
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (!password) {
    return { isValid: false, message: '请输入密码' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: '密码至少需要8个字符' };
  }
  
  if (!REGEX.PASSWORD.test(password)) {
    return { isValid: false, message: '密码必须包含至少一个字母和一个数字' };
  }
  
  return { isValid: true, message: '' };
};

// 验证确认密码
export const validateConfirmPassword = (password: string, confirmPassword: string): { isValid: boolean; message: string } => {
  if (!confirmPassword) {
    return { isValid: false, message: '请确认密码' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: '两次输入的密码不一致' };
  }
  
  return { isValid: true, message: '' };
};

// 验证聊天室名称
export const validateRoomName = (roomName: string): { isValid: boolean; message: string } => {
  if (!roomName) {
    return { isValid: false, message: '请输入聊天室名称' };
  }
  
  if (roomName.length < 2) {
    return { isValid: false, message: '聊天室名称至少需要2个字符' };
  }
  
  if (roomName.length > 30) {
    return { isValid: false, message: '聊天室名称不能超过30个字符' };
  }
  
  return { isValid: true, message: '' };
};

// 验证聊天室描述
export const validateRoomDescription = (description: string): { isValid: boolean; message: string } => {
  if (description && description.length > 200) {
    return { isValid: false, message: '聊天室描述不能超过200个字符' };
  }
  
  return { isValid: true, message: '' };
};

// 验证消息内容
export const validateMessage = (message: string): { isValid: boolean; message: string } => {
  if (!message || message.trim() === '') {
    return { isValid: false, message: '消息内容不能为空' };
  }
  
  if (message.length > 1000) {
    return { isValid: false, message: '消息内容不能超过1000个字符' };
  }
  
  return { isValid: true, message: '' };
};

// 验证文件大小
export const validateFileSize = (file: File, maxSize: number): { isValid: boolean; message: string } => {
  if (file.size > maxSize) {
    const sizeInMB = Math.round(maxSize / (1024 * 1024));
    return { isValid: false, message: `文件大小不能超过${sizeInMB}MB` };
  }
  
  return { isValid: true, message: '' };
};

// 验证文件类型
export const validateFileType = (file: File, allowedTypes: string[]): { isValid: boolean; message: string } => {
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: '不支持的文件类型' };
  }
  
  return { isValid: true, message: '' };
};

// 验证注册表单
export const validateRegisterForm = (formData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const usernameValidation = validateUsername(formData.username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.message;
  }
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }
  
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }
  
  const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// 验证登录表单
export const validateLoginForm = (formData: {
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!formData.email) {
    errors.email = '请输入邮箱';
  } else if (!REGEX.EMAIL.test(formData.email)) {
    errors.email = '请输入有效的邮箱地址';
  }
  
  if (!formData.password) {
    errors.password = '请输入密码';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// 验证创建聊天室表单
export const validateCreateRoomForm = (formData: {
  name: string;
  description: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const nameValidation = validateRoomName(formData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }
  
  const descriptionValidation = validateRoomDescription(formData.description);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};