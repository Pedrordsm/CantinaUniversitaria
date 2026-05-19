import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Product, Category } from '../../types';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

function getImageUrl(url?: string) {
  if (!url) return null;
  return url;
}

export default function MenuPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { addItem, items, updateQuantity, removeItem, itemCount } = useCartStore();
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'available'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data as Product[];
    },
    refetchInterval: 30000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data as Category[];
    },
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const getCartQuantity = (productId: string) => {
    return items.find((i) => i.product.id === productId)?.quantity || 0;
  };

  const handleAdd = (product: Product) => {
    if (product.status !== 'disponivel') {
      toast.error('Produto indisponível');
      return;
    }
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const handleIncrease = (product: Product) => {
    const current = getCartQuantity(product.id);
    if (current >= product.quantity) {
      toast.error('Quantidade máxima atingida');
      return;
    }
    updateQuantity(product.id, current + 1);
  };

  const handleDecrease = (product: Product) => {
    const current = getCartQuantity(product.id);
    if (current <= 1) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, current - 1);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Cardápio</h1>
        <p className="text-gray-500">Escolha seus itens favoritos</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input sm:w-48"
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const cartQty = getCartQuantity(product.id);
            const isUnavailable = product.status !== 'disponivel';

            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  isUnavailable ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:shadow-md'
                }`}
              >
                {/* Imagem */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {getImageUrl(product.image_url) ? (
                    <img
                      src={getImageUrl(product.image_url)!}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
                      🍽️
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`badge-${product.status}`}>
                      {product.status === 'disponivel' ? 'Disponível' : 'Em falta'}
                    </span>
                  </div>
                  {product.category_name && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        {product.category_name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                  )}
                  <p className="text-lg font-bold text-primary-600 mb-3">
                    R$ {Number(product.price).toFixed(2)}
                  </p>

                  {cartQty === 0 ? (
                    <button
                      onClick={() => handleAdd(product)}
                      disabled={isUnavailable}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-2"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleDecrease(product)}
                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-lg text-gray-900">{cartQty}</span>
                      <button
                        onClick={() => handleIncrease(product)}
                        className="w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating cart button */}
      {itemCount() > 0 && (
        <button
          onClick={() => navigate('/carrinho')}
          className="fixed bottom-6 right-6 bg-primary-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
        >
          <ShoppingCart size={20} />
          Ver carrinho ({itemCount()} itens)
        </button>
      )}
    </div>
  );
}
