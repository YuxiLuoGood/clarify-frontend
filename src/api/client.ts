import axios from 'axios';

// 所有请求都发到后端的 8080 端口
const client = axios.create({
  baseURL: 'http://localhost:8080',
});

// 每次发请求前，自动把 token 加到请求头里
// 这样就不用每个请求都手动写 Authorization 了
client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 如果后端返回 401（token 过期或无效），自动跳转到登录页
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关
export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ token: string }>('/api/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    client.post<{ token: string }>('/api/auth/register', { email, password, name }),
};

// 交易相关
export const transactionApi = {
  getAll: (month?: string) =>
    client.get('/api/transactions', { params: { month } }),

  create: (data: any) =>
    client.post('/api/transactions', data),

  update: (id: string, data: any) =>
    client.put(`/api/transactions/${id}`, data),

  delete: (id: string) =>
    client.delete(`/api/transactions/${id}`),
};

// 预测相关
export const forecastApi = {
  getForecast: (months: number = 3) =>
    client.get('/api/forecast', { params: { months } }),
};

// 统计相关
export const statsApi = {
  monthly: (month: string) =>
    client.get('/api/stats/monthly', { params: { month } }),

  trend: (months: number = 6) =>
    client.get('/api/stats/trend', { params: { months } }),
};