import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const BACKEND_URL = 'http://localhost:3001';

function getImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCartStore();
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  const createOrder = useMutation({
    mutationFn: async () => {
      const orderItems = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));
      const res = await api.post('/orders', { items: orderItems, notes });
      return res.data;
    },
    onSuccess: () => {
      clearCart();
      toast.success('Pedido realizado com sucesso!');
      navigate('/pedidos');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erro ao realizar pedido');
    },
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart size={64} className="mx-auto text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-500 mb-2">Carrinho vazio</h2>
        <p className="text-gray-400 mb-6">Adicione itens do cardápio para continuar</p>
        <button onClick={() => navigate('/cardapio')} className="btn-primary">
          Ver Cardápio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cardapio')} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Carrinho</h1>
      </div>

      <div className="space-y-3 mb-6">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="card flex items-center gap-4 p-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {getImageUrl(product.image_url) ? (
                <img src={getImageUrl(product.image_url)!} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500">R$ {Number(product.price).toFixed(2)} cada</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.quantity}
                className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center disabled:opacity-50"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="text-right min-w-[70px]">
              <p className="font-bold text-gray-900">R$ {(Number(product.price) * quantity).toFixed(2)}</p>
            </div>

            <button
              onClick={() => removeItem(product.id)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Observações */}
      <div className="card mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input resize-none"
          rows={3}
          placeholder="Ex: sem cebola, ponto da carne..."
        />
      </div>

      {/* Resumo */}
      <div className="card mb-6">
        <div className="space-y-2">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-sm text-gray-600">
              <span>{product.name} x{quantity}</span>
              <span>R$ {(Number(product.price) * quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary-600">R$ {total().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={clearCart} className="btn-secondary flex-1">
          Limpar carrinho
        </button>
        <button
          onClick={() => createOrder.mutate()}
          disabled={createOrder.isPending}
          className="btn-primary flex-1 py-3 text-base"
        >
          {createOrder.isPending ? 'Realizando pedido...' : `Fazer Pedido • R$ ${total().toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
