import axios from 'axios';
import { API_URL } from '../config';
import { clearToken, getToken } from '../auth/token';
import type {
  ForecastPoint,
  MonthlyStats,
  TokenResponse,
  Transaction,
  TransactionRequest,
  TrendData,
} from '../types';

const client = axios.create({ baseURL: API_URL });

// Attach the JWT to every request.
client.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 = token missing, invalid or expired: drop it and go to the login page.
// (Wrong credentials on the login form are 400, so they never land here.)
client.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

/**
 * The API reports errors as {"message": "..."} or, for validation,
 * {"<field>": "<message>"}. Returns that object, or null for network errors.
 */
export function apiErrorBody(error: unknown): Record<string, string> | null {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (data && typeof data === 'object') return data as Record<string, string>;
  }
  return null;
}

export const authApi = {
  login: (email: string, password: string) =>
    client.post<TokenResponse>('/api/auth/login', { email, password }).then(r => r.data),

  register: (email: string, password: string, name: string) =>
    client.post<TokenResponse>('/api/auth/register', { email, password, name }).then(r => r.data),

  googleLogin: (credential: string) =>
    client.post<TokenResponse>('/api/auth/google', { credential }).then(r => r.data),
};

export const transactionApi = {
  getAll: (month?: string) =>
    client.get<Transaction[]>('/api/transactions', { params: { month } }).then(r => r.data),

  create: (data: TransactionRequest) =>
    client.post<Transaction>('/api/transactions', data).then(r => r.data),

  update: (id: string, data: TransactionRequest) =>
    client.put<Transaction>(`/api/transactions/${id}`, data).then(r => r.data),

  delete: (id: string) => client.delete(`/api/transactions/${id}`).then(() => undefined),
};

export const statsApi = {
  monthly: (month: string) =>
    client.get<MonthlyStats>('/api/stats/monthly', { params: { month } }).then(r => r.data),

  trend: (months = 6) =>
    client.get<TrendData[]>('/api/stats/trend', { params: { months } }).then(r => r.data),
};

export const forecastApi = {
  getForecast: (months = 3) =>
    client.get<ForecastPoint[]>('/api/forecast', { params: { months } }).then(r => r.data),
};
