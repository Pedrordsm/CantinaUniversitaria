import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock, XCircle, Users, DollarSign, Package, ShoppingBag } from 'lucide-react';
import api from '../../lib/api';

type CancellationReport = {
  id: string;
  name: string;
  cancel_count: number;
  total_value_cancelled: number;
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'products' | 'hours' | 'cancellations'>('summary');

  const { data: summary } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: async () => {
      const res = await api.get('/reports/summary');
      return res.data;
    },
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ['reports', 'top-products'],
    queryFn: async () => {
      const res = await api.get('/reports/top-products?limit=10');
      return res.data;
    },
    enabled: activeTab === 'products',
  });

  const { data: peakHours = [] } = useQuery({
    queryKey: ['reports', 'peak-hours'],
    queryFn: async () => {
      const res = await api.get('/reports/peak-hours');
      return res.data;
    },
    enabled: activeTab === 'hours',
  });

  const { data: cancellations = [] } = useQuery({
    queryKey: ['reports', 'cancellations'],
    queryFn: async () => {
      const res = await api.get('/reports/cancellations');
      return res.data;
    },
    enabled: activeTab === 'cancellations',
  });

  const tabs = [
    { id: 'summary', label: 'Resumo', icon: TrendingUp },
    { id: 'products', label: 'Mais Vendidos', icon: Package },
    { id: 'hours', label: 'Horários de Pico', icon: Clock },
    { id: 'cancellations', label: 'Cancelamentos', icon: XCircle },
  ] as const;

  const cancellationItems = cancellations as CancellationReport[];
  const totalCancellations = cancellationItems.reduce((sum, item) => sum + item.cancel_count, 0);
  const totalCancelledValue = cancellationItems.reduce((sum, item) => sum + item.total_value_cancelled, 0);
  const mostCancelledProduct = cancellationItems[0];
  const averageCancelledTicket = totalCancellations > 0 ? totalCancelledValue / totalCancellations : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 text-sm">Análise de desempenho da cantina</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {activeTab === 'summary' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg"><ShoppingBag size={20} className="text-blue-600" /></div>
                <p className="text-sm text-gray-500">Total de Pedidos</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.orders.total}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg"><DollarSign size={20} className="text-green-600" /></div>
                <p className="text-sm text-gray-500">Receita Total</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                R$ {Number(summary.revenue.total_revenue).toFixed(2)}
              </p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg"><Package size={20} className="text-orange-600" /></div>
                <p className="text-sm text-gray-500">Produtos Ativos</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.products.disponivel}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg"><Users size={20} className="text-purple-600" /></div>
                <p className="text-sm text-gray-500">Clientes</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.users.clientes}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Status dos Pedidos</h3>
              <div className="space-y-2">
                {[
                  { label: 'Pendentes', value: summary.orders.pendente, color: 'bg-blue-500' },
                  { label: 'Em Preparo', value: summary.orders.em_preparo, color: 'bg-orange-500' },
                  { label: 'Prontos', value: summary.orders.pronto, color: 'bg-green-500' },
                  { label: 'Retirados', value: summary.orders.retirado, color: 'bg-gray-400' },
                  { label: 'Cancelados', value: summary.orders.cancelado, color: 'bg-red-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm text-gray-600 flex-1">{label}</span>
                    <span className="font-bold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Receita</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Hoje</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {Number(summary.revenue.today_revenue).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Este mês</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {Number(summary.revenue.month_revenue).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total geral</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {Number(summary.revenue.total_revenue).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Products */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'total_sold' ? 'Vendidos' : 'Receita']} />
                <Bar dataKey="total_sold" fill="#f97316" name="total_sold" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Detalhes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Produto</th>
                    <th className="pb-2 font-medium text-right">Vendidos</th>
                    <th className="pb-2 font-medium text-right">Pedidos</th>
                    <th className="pb-2 font-medium text-right">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p: { id: string; name: string; total_sold: number; order_count: number; total_revenue: number }, i: number) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium text-gray-900">{p.name}</td>
                      <td className="py-2 text-right">{p.total_sold}</td>
                      <td className="py-2 text-right">{p.order_count}</td>
                      <td className="py-2 text-right font-medium text-green-600">
                        R$ {Number(p.total_revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Peak Hours */}
      {activeTab === 'hours' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Horários de Pico de Retirada</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(h) => `${String(h).padStart(2, '0')}h`}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(h) => `${String(h).padStart(2, '0')}:00`}
                formatter={(value) => [value, 'Pedidos retirados']}
              />
              <Bar dataKey="order_count" fill="#3b82f6" name="order_count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cancellations */}
      {activeTab === 'cancellations' && (
        <div className="space-y-6">
          {cancellationItems.length === 0 ? (
            <div className="card">
              <p className="text-gray-400 text-center py-8">Nenhum cancelamento registrado</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-lg"><XCircle size={20} className="text-red-600" /></div>
                    <p className="text-sm text-gray-500">Cancelamentos</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalCancellations}</p>
                </div>

                <div className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg"><DollarSign size={20} className="text-amber-600" /></div>
                    <p className="text-sm text-gray-500">Valor perdido</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">R$ {totalCancelledValue.toFixed(2)}</p>
                </div>

                <div className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg"><Package size={20} className="text-blue-600" /></div>
                    <p className="text-sm text-gray-500">Mais cancelado</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 truncate">{mostCancelledProduct.name}</p>
                  <p className="text-sm text-gray-500">{mostCancelledProduct.cancel_count} cancelamentos</p>
                </div>

                <div className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg"><ShoppingBag size={20} className="text-emerald-600" /></div>
                    <p className="text-sm text-gray-500">Ticket médio</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">R$ {averageCancelledTicket.toFixed(2)}</p>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Detalhes dos Cancelamentos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Produto</th>
                        <th className="pb-2 font-medium text-right">Cancelamentos</th>
                        <th className="pb-2 font-medium text-right">Participação</th>
                        <th className="pb-2 font-medium text-right">Ticket médio</th>
                        <th className="pb-2 font-medium text-right">Valor perdido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancellationItems.map((item, index) => {
                        const participation = totalCancellations > 0 ? (item.cancel_count / totalCancellations) * 100 : 0;
                        const averageValue = item.cancel_count > 0 ? item.total_value_cancelled / item.cancel_count : 0;

                        return (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-2 text-gray-400">{index + 1}</td>
                            <td className="py-2 font-medium text-gray-900">{item.name}</td>
                            <td className="py-2 text-right text-red-600 font-bold">{item.cancel_count}</td>
                            <td className="py-2 text-right">{participation.toFixed(1)}%</td>
                            <td className="py-2 text-right text-gray-500">R$ {averageValue.toFixed(2)}</td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              R$ {item.total_value_cancelled.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
