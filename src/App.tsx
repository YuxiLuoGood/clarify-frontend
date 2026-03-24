import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetAlertToast from './components/BudgetAlertToast';
import { useWebSocket } from './useWebSocket';

const isLoggedIn = () => !!localStorage.getItem('token');

function getEmail(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

function PrivateRoute({ children }: { children: React.ReactElement }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

function AppWithAlerts() {
  const email = getEmail();
  const { alerts, dismissAlert } = useWebSocket(email);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute><TransactionsPage /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      <BudgetAlertToast alerts={alerts} onDismiss={dismissAlert} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithAlerts />
    </BrowserRouter>
  );
}