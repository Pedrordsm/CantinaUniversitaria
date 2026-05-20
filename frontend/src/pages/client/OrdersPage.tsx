import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, ChevronDown, ChevronUp, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../lib/api';
import { Order } from '../../types';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto para Retirada',
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

const STATUS_ICONS: Record<string, string> = {
  pendente: '⏳',
  aceito: '👍',
  em_preparo: '👨‍🍳',
  pronto: '✅',
  retirado: '🎉',
  cancelado: '❌',
};

export default function OrdersPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data as Order[];
    },
    refetchInterval: 15000,
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      await api.patch(`/orders/${orderId}/cancel`, { cancel_reason: 'Cancelado pelo cliente' });
    },
    onSuccess: () => {
      toast.success('Pedido cancelado');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancellingId(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erro ao cancelar pedido');
      setCancellingId(null);
    },
  });

  const activeOrders = orders.filter((o) => !['retirado', 'cancelado'].includes(o.status));
  const pastOrders = orders.filter((o) => ['retirado', 'cancelado'].includes(o.status));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <ClipboardList size={64} className="mx-auto text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-500 mb-2">Nenhum pedido ainda</h2>
        <p className="text-gray-400">Seus pedidos aparecerão aqui</p>
      </div>
    );
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const isExpanded = expandedId === order.id;
    const canCancel = order.status === 'pendente';

    return (
      <div className="card p-0 overflow-hidden">
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : order.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{STATUS_ICONS[order.status]}</span>
              <div>
                <p className="font-medium text-gray-900">
                  Pedido #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={STATUS_BADGES[order.status]}>{STATUS_LABELS[order.status]}</span>
                <p className="text-sm font-bold text-gray-900 mt-1">R$ {Number(order.total).toFixed(2)}</p>
              </div>
              {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Itens do pedido</h4>
            <div className="space-y-2 mb-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.product_name} <span className="text-gray-400">x{item.quantity}</span>
                  </span>
                  <span className="font-medium">R$ {Number(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium">Obs:</span> {order.notes}
              </p>
            )}

            {order.cancel_reason && (
              <p className="text-sm text-red-600 mb-3">
                <span className="font-medium">Motivo do cancelamento:</span> {order.cancel_reason}
              </p>
            )}

            {canCancel && (
              <div>
                {cancellingId === order.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => cancelOrder.mutate(order.id)}
                      disabled={cancelOrder.isPending}
                      className="btn-danger text-sm py-1.5 px-3"
                    >
                      Confirmar cancelamento
                    </button>
                    <button
                      onClick={() => setCancellingId(null)}
                      className="btn-secondary text-sm py-1.5 px-3"
                    >
                      Voltar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCancellingId(order.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    <X size={14} />
                    Cancelar pedido
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pedidos Ativos ({activeOrders.length})
          </h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {pastOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Histórico ({pastOrders.length})
          </h2>
          <div className="space-y-3">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
