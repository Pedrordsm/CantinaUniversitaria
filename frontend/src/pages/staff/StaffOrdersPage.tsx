import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Check, X, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { Order } from '../../types';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  retirado: 'Retirado',
  cancelado: 'Cancelado',
};

const NEXT_STATUS: Record<string, string> = {
  pendente: 'aceito',
  aceito: 'em_preparo',
  em_preparo: 'pronto',
  pronto: 'retirado',
};

const NEXT_LABEL: Record<string, string> = {
  pendente: 'Aceitar',
  aceito: 'Iniciar Preparo',
  em_preparo: 'Marcar Pronto',
  pronto: 'Confirmar Retirada',
};

export default function StaffOrdersPage() {
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/orders${params}`);
      return res.data as Order[];
    },
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status, cancelReason }: { orderId: string; status: string; cancelReason?: string }) => {
      await api.patch(`/orders/${orderId}/status`, { status, cancel_reason: cancelReason });
    },
    onSuccess: () => {
      toast.success('Status atualizado');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancellingId(null);
      setCancelReason('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erro ao atualizar status');
    },
  });

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeStatuses = ['pendente', 'aceito', 'em_preparo', 'pronto'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm">Gerencie os pedidos da cantina</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {activeStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`card p-3 text-center cursor-pointer transition-all ${
              filterStatus === status ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{statusCounts[status] || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{STATUS_LABELS[status]}</p>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !filterStatus ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const nextStatus = NEXT_STATUS[order.status];
            const canCancel = !['retirado', 'cancelado'].includes(order.status);

            return (
              <div key={order.id} className="card p-0 overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <span className={`badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.user_name} •{' '}
                          {format(new Date(order.created_at), "HH:mm 'de' dd/MM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900">R$ {Number(order.total).toFixed(2)}</p>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Itens</h4>
                      <div className="space-y-1">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.product_name} <span className="text-gray-400">x{item.quantity}</span>
                            </span>
                            <span>R$ {Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-sm text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 rounded p-2">
                        <span className="font-medium">Obs:</span> {order.notes}
                      </p>
                    )}

                    {cancellingId === order.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Motivo do cancelamento"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="input text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus.mutate({ orderId: order.id, status: 'cancelado', cancelReason })}
                            disabled={updateStatus.isPending}
                            className="btn-danger text-sm py-1.5 px-3"
                          >
                            Confirmar Cancelamento
                          </button>
                          <button onClick={() => setCancellingId(null)} className="btn-secondary text-sm py-1.5 px-3">
                            Voltar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {nextStatus && (
                          <button
                            onClick={() => updateStatus.mutate({ orderId: order.id, status: nextStatus })}
                            disabled={updateStatus.isPending}
                            className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3"
                          >
                            <Check size={14} />
                            {NEXT_LABEL[order.status]}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => setCancellingId(order.id)}
                            className="btn-danger flex items-center gap-1 text-sm py-1.5 px-3"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
