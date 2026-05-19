import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Client pages
import ClientLayout from './layouts/ClientLayout';
import MenuPage from './pages/client/MenuPage';
import CartPage from './pages/client/CartPage';
import OrdersPage from './pages/client/OrdersPage';

// Staff pages
import StaffLayout from './layouts/StaffLayout';
import StaffOrdersPage from './pages/staff/StaffOrdersPage';
import ProductsPage from './pages/staff/ProductsPage';

// Manager pages
import ReportsPage from './pages/manager/ReportsPage';
import UsersPage from './pages/manager/UsersPage';

// Layout wrapper para cliente — protege e renderiza o layout
function ClientApp() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'cliente') return <Navigate to="/login" replace />;
  return <ClientLayout />;
}

// Layout wrapper para funcionário/gerente
function StaffApp() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'funcionario' && user.role !== 'gerente') return <Navigate to="/login" replace />;
  return <StaffLayout />;
}

// Redireciona para a página correta baseado no role
function RoleRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'cliente') return <Navigate to="/cardapio" replace />;
  if (user.role === 'funcionario') return <Navigate to="/funcionario/pedidos" replace />;
  if (user.role === 'gerente') return <Navigate to="/gerente/relatorios" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  useSocket();

  const { _hasHydrated } = useAuthStore();

  // Aguarda o Zustand hidratar o estado do localStorage antes de renderizar
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Raiz — redireciona por role */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Rotas do Cliente — ClientApp verifica auth e renderiza ClientLayout com Outlet */}
      <Route element={<ClientApp />}>
        <Route path="/cardapio" element={<MenuPage />} />
        <Route path="/carrinho" element={<CartPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
      </Route>

      {/* Rotas do Funcionário e Gerente — StaffApp verifica auth e renderiza StaffLayout com Outlet */}
      <Route element={<StaffApp />}>
        <Route path="/funcionario/pedidos" element={<StaffOrdersPage />} />
        <Route path="/funcionario/produtos" element={<ProductsPage />} />
        <Route path="/gerente/relatorios" element={<ReportsPage />} />
        <Route path="/gerente/usuarios" element={<UsersPage />} />
        <Route path="/gerente/pedidos" element={<StaffOrdersPage />} />
        <Route path="/gerente/produtos" element={<ProductsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
