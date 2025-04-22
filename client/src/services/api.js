import axios from 'axios';

// 从环境变量获取API基础URL，如果没有则使用默认值
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 创建axios实例
const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // 允许跨域请求携带 cookie
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'  // 帮助服务器识别AJAX请求
  },
  // 设置跨域
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 对响应数据进行处理
    return response;
  },
  (error) => {
    if (error.response) {
      // 处理特定的错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，可能是未登录或 session 过期
          console.log('未授权，请重新登录');
          // 如果是获取用户信息的请求，不需要重定向
          if (!error.config.url.includes('/api/auth/me')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          // 禁止访问
          console.log('没有权限访问该资源');
          break;
        case 404:
          // 资源不存在
          console.log('请求的资源不存在');
          break;
        default:
          console.log('请求出错:', error.response.status);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 