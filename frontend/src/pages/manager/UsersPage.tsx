import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../lib/api';
import { User, Order } from '../../types';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as User[];
    },
  });

  const { data: userOrders = [] } = useQuery({
    queryKey: ['user-orders', selectedUser?.id],
    queryFn: async () => {
      const res = await api.get(`/users/${selectedUser!.id}/orders`);
      return res.data as Order[];
    },
    enabled: !!selectedUser,
  });

  const toggleBan = useMutation({
    mutationFn: async ({ id, is_banned }: { id: string; is_banned: boolean }) => {
      await api.patch(`/users/${id}/ban`, { is_banned });
    },
    onSuccess: (_, { is_banned }) => {
      toast.success(is_banned ? 'Usuário banido' : 'Usuário desbanido');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Erro ao alterar status do usuário'),
  });

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    aceito: 'Aceito',
    em_preparo: 'Em Preparo',
    pronto: 'Pronto',
    retirado: 'Retirado',
    cancelado: 'Cancelado',
  };

  const STATUS_BADGES: Record<string, string> = {
    pendente: 'badge-pendente',
    aceito: 'badge-aceito',
    em_preparo: 'badge-em_preparo',
    pronto: 'badge-pronto',
    retirado: 'badge-retirado',
    cancelado: 'badge-cancelado',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-500 text-sm">Gerencie os clientes da cantina</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-16" />
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">Usuário</th>
                <th className="text-left p-4 font-medium text-gray-500">Perfil</th>
                <th className="text-center p-4 font-medium text-gray-500">Cancelamentos</th>
                <th className="text-center p-4 font-medium text-gray-500">Status</th>
                <th className="text-center p-4 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-gray-600">{user.role}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`font-bold ${
                        user.cancel_count >= 5
                          ? 'text-red-600'
                          : user.cancel_count >= 3
                          ? 'text-yellow-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {user.cancel_count}
                    </span>
                    {user.cancel_count >= 5 && (
                      <span className="ml-1 text-xs text-red-500">⚠️</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {user.is_banned ? (
                      <span className="badge-cancelado">Banido</span>
                    ) : (
                      <span className="badge-disponivel">Ativo</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver pedidos"
                      >
                        <Eye size={16} />
                      </button>
                      {user.role === 'cliente' && (
                        <button
                          onClick={() => toggleBan.mutate({ id: user.id, is_banned: !user.is_banned })}
                          className={`p-1.5 transition-colors ${
                            user.is_banned
                              ? 'text-gray-400 hover:text-green-600'
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                          title={user.is_banned ? 'Desbanir' : 'Banir'}
                        >
                          {user.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de pedidos do usuário */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold">Pedidos de {selectedUser.name}</h2>
                <p className="text-sm text-gray-500">{selectedUser.email} • {selectedUser.cancel_count} cancelamentos</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {userOrders.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhum pedido encontrado</p>
              ) : (
                <div className="space-y-2">
                  {userOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                        {order.cancel_reason && (
                          <p className="text-xs text-red-500 mt-0.5">{order.cancel_reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`${STATUS_BADGES[order.status]} mb-1`}>{STATUS_LABELS[order.status]}</span>
                        <p className="text-sm font-bold">R$ {Number(order.total).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <div>
                {selectedUser.is_banned ? (
                  <button
                    onClick={() => {
                      toggleBan.mutate({ id: selectedUser.id, is_banned: false });
                      setSelectedUser(null);
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Desbanir usuário
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (confirm(`Banir ${selectedUser.name}?`)) {
                        toggleBan.mutate({ id: selectedUser.id, is_banned: true });
                        setSelectedUser(null);
                      }
                    }}
                    className="btn-danger flex items-center gap-2"
                  >
                    <Ban size={16} />
                    Banir usuário
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedUser(null)} className="btn-secondary">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
