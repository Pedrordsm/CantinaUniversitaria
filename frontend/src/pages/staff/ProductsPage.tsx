import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, X } from 'lucide-react';
import api from '../../lib/api';
import { Product, Category } from '../../types';
import toast from 'react-hot-toast';

const BACKEND_URL = 'http://localhost:3001';

function getImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  category_id: string;
  status: string;
  image?: File | null;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  quantity: '',
  category_id: '',
  status: 'disponivel',
  image: null,
};

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [search, setSearch] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await api.get('/products/all');
      return res.data as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data as Category[];
    },
  });

  const saveProduct = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('quantity', form.quantity);
      formData.append('status', form.status);
      if (form.category_id) formData.append('category_id', form.category_id);
      if (form.image) formData.append('image', form.image);

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Produto atualizado' : 'Produto criado');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erro ao salvar produto');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Produto excluído');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Erro ao excluir produto'),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/products/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Erro ao alterar status'),
  });

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category_id: product.category_id || '',
      status: product.status,
      image: null,
    });
    setImagePreview(getImageUrl(product.image_url));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((f) => ({ ...f, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm">Gerencie o cardápio da cantina</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="card p-0 overflow-hidden">
              <div className="h-40 bg-gray-100 relative">
                {getImageUrl(product.image_url) ? (
                  <img
                    src={getImageUrl(product.image_url)!}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🍽️</div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`badge-${product.status}`}>
                    {product.status === 'disponivel' ? 'Disponível' : product.status === 'em_falta' ? 'Em falta' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="font-bold text-primary-600">R$ {Number(product.price).toFixed(2)}</p>
                </div>
                {product.category_name && (
                  <p className="text-xs text-gray-400 mb-1">{product.category_name}</p>
                )}
                <p className="text-sm text-gray-500 mb-3">Estoque: {product.quantity} unidades</p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      toggleStatus.mutate({
                        id: product.id,
                        status: product.status === 'disponivel' ? 'em_falta' : 'disponivel',
                      })
                    }
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title={product.status === 'disponivel' ? 'Marcar em falta' : 'Marcar disponível'}
                  >
                    {product.status === 'disponivel' ? (
                      <ToggleRight size={18} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={18} className="text-gray-400" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${product.name}"?`)) {
                        deleteProduct.mutate(product.id);
                      }
                    }}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto do produto</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🍽️</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                  placeholder="Nome do produto"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input resize-none"
                  rows={2}
                  placeholder="Descrição opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="input"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="input"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="input"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="input"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="em_falta">Em falta</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => saveProduct.mutate()}
                disabled={saveProduct.isPending || !form.name || !form.price || !form.quantity}
                className="btn-primary flex-1"
              >
                {saveProduct.isPending ? 'Salvando...' : editingProduct ? 'Salvar' : 'Criar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
