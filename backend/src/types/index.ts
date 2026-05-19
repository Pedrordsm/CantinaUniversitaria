export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'cliente' | 'funcionario' | 'gerente';
  is_banned: boolean;
  cancel_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: 'pendente' | 'aceito' | 'em_preparo' | 'pronto' | 'retirado' | 'cancelado';
  total: number;
  notes?: string;
  cancelled_by?: 'cliente' | 'funcionario' | 'gerente';
  cancel_reason?: string;
  items?: OrderItem[];
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
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
  created_at: Date;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
