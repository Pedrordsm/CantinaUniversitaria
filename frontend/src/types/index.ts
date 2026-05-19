export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cliente' | 'funcionario' | 'gerente';
  is_banned: boolean;
  cancel_count: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image_url?: string;
  status: 'disponivel' | 'em_falta' | 'inativo';
  category_id?: string;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: 'pendente' | 'aceito' | 'em_preparo' | 'pronto' | 'retirado' | 'cancelado';
  total: number;
  notes?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  role?: string;
  title: string;
  message: string;
  type: string;
  order_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
