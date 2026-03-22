import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';

// 检查用户是否已登录（有没有 token）
const isLoggedIn = () => !!localStorage.getItem('token');

// 需要登录才能访问的页面，没登录就跳转到登录页
function PrivateRoute({ children }: { children: React.ReactElement }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute><TransactionsPage /></PrivateRoute>
        } />
        {/* 默认跳转到 dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}