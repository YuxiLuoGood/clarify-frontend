import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import BudgetAlertToast from './components/BudgetAlertToast';
import { useBudgetAlerts } from './hooks/useBudgetAlerts';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import TransactionsPage from './pages/TransactionsPage';

function PrivateRoute({ children }: { children: ReactElement }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { token } = useAuth();
  const { alerts, dismissAlert } = useBudgetAlerts(token);

  return (
    <>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <BudgetAlertToast alerts={alerts} onDismiss={dismissAlert} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
