import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, Package, LogOut, UtensilsCrossed, Bell, BarChart2, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function StaffLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isManager = user?.role === 'gerente';

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data.count as number;
    },
    refetchInterval: 15000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const basePath = isManager ? '/gerente' : '/funcionario';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="text-primary-400" size={24} />
            <div>
              <p className="font-bold text-white">Cantina</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to={`${basePath}/pedidos`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <ClipboardList size={18} />
            Pedidos
            {(unreadCount ?? 0) > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to={`${basePath}/produtos`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <Package size={18} />
            Produtos
          </NavLink>

          {isManager && (
            <>
              <NavLink
                to="/gerente/relatorios"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                <BarChart2 size={18} />
                Relatórios
              </NavLink>

              <NavLink
                to="/gerente/usuarios"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                <Users size={18} />
                Usuários
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm w-full"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
