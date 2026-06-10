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
  status: 'pendente' | 'aceito' | 'em_preparo' | 'pronto' | 'retirado' | 'cancelado';
  total: number;
  notes?: string;
  cancelled_by?: string;
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
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

// Para permitir que o Express reconheça a propriedade 'user' no objeto Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}