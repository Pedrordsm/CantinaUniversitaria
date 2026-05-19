import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, ClipboardList, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function ClientLayout() {
  const { user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data.count as number;
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="text-primary-600" size={28} />
            <span className="text-xl font-bold text-gray-900">Cantina Universitária</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/cardapio"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <UtensilsCrossed size={16} />
              Cardápio
            </NavLink>

            <NavLink
              to="/carrinho"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <ShoppingCart size={16} />
              Carrinho
              {itemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount()}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/pedidos"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <ClipboardList size={16} />
              Meus Pedidos
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden md:block">Olá, {user?.name?.split(' ')[0]}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-t border-gray-100">
          <NavLink
            to="/cardapio"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs ${isActive ? 'text-primary-600' : 'text-gray-500'}`
            }
          >
            <UtensilsCrossed size={20} />
            Cardápio
          </NavLink>
          <NavLink
            to="/carrinho"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs relative ${isActive ? 'text-primary-600' : 'text-gray-500'}`
            }
          >
            <ShoppingCart size={20} />
            Carrinho
            {itemCount() > 0 && (
              <span className="absolute top-1 right-1/4 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount()}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/pedidos"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs ${isActive ? 'text-primary-600' : 'text-gray-500'}`
            }
          >
            <Bell size={20} />
            Pedidos
          </NavLink>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
