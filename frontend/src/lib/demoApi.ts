import { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Category, Notification, Order, OrderItem, Product, User } from '../types';

type DemoUser = User & { password: string };

interface DemoDatabase {
  users: DemoUser[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  notifications: Notification[];
}

const STORAGE_KEY = 'cantina-demo-db-v1';

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);

const categories: Category[] = [
  { id: 'cat-lanches', name: 'Lanches' },
  { id: 'cat-bebidas', name: 'Bebidas' },
  { id: 'cat-refeicoes', name: 'Refeicoes' },
  { id: 'cat-sobremesas', name: 'Sobremesas' },
  { id: 'cat-salgados', name: 'Salgados' },
];

const demoProducts: Product[] = [
  ['X-Burguer', 'Hamburguer artesanal com queijo, alface e tomate', 12.5, 20, 'cat-lanches'],
  ['X-Frango', 'Frango grelhado com queijo e maionese especial', 11, 15, 'cat-lanches'],
  ['Misto Quente', 'Pao de forma com presunto e queijo', 6, 30, 'cat-lanches'],
  ['Coca-Cola Lata', 'Refrigerante gelado 350ml', 5, 50, 'cat-bebidas'],
  ['Suco de Laranja', 'Suco natural 300ml', 7, 20, 'cat-bebidas'],
  ['Agua Mineral', 'Agua mineral 500ml', 3, 100, 'cat-bebidas'],
  ['Cafe', 'Cafe coado 200ml', 4, 40, 'cat-bebidas'],
  ['Prato Feito', 'Arroz, feijao, carne e salada', 18, 10, 'cat-refeicoes'],
  ['Macarrao', 'Macarrao ao molho bolonhesa', 15, 8, 'cat-refeicoes'],
  ['Pudim', 'Pudim de leite condensado', 6, 15, 'cat-sobremesas'],
  ['Brigadeiro', 'Brigadeiro artesanal', 3.5, 25, 'cat-sobremesas'],
  ['Coxinha', 'Coxinha de frango 100g', 5, 30, 'cat-salgados'],
  ['Esfiha', 'Esfiha de carne 80g', 4.5, 25, 'cat-salgados'],
].map(([name, description, price, quantity, categoryId]) => {
  const category = categories.find((item) => item.id === categoryId);
  return {
    id: `prod-${String(name).toLowerCase().replace(/\s+/g, '-')}`,
    name: String(name),
    description: String(description),
    price: Number(price),
    quantity: Number(quantity),
    status: Number(quantity) > 0 ? 'disponivel' : 'em_falta',
    category_id: String(categoryId),
    category_name: category?.name,
    created_at: now(),
    updated_at: now(),
  } as Product;
});

function createInitialDb(): DemoDatabase {
  const createdAt = now();
  return {
    users: [
      { id: 'user-gerente', name: 'Gerente Silva', email: 'gerente@cantina.com', password: '123456', role: 'gerente', is_banned: false, cancel_count: 0, created_at: createdAt },
      { id: 'user-funcionario', name: 'Funcionario Joao', email: 'funcionario@cantina.com', password: '123456', role: 'funcionario', is_banned: false, cancel_count: 0, created_at: createdAt },
      { id: 'user-cliente', name: 'Cliente Maria', email: 'cliente@cantina.com', password: '123456', role: 'cliente', is_banned: false, cancel_count: 0, created_at: createdAt },
      { id: 'user-pedro', name: 'Cliente Pedro', email: 'pedro@cantina.com', password: '123456', role: 'cliente', is_banned: false, cancel_count: 0, created_at: createdAt },
    ],
    categories,
    products: demoProducts,
    orders: [],
    notifications: [],
  };
}

function loadDb() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const db = createInitialDb();
    saveDb(db);
    return db;
  }
  return JSON.parse(stored) as DemoDatabase;
}

function saveDb(db: DemoDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function publicUser(user: DemoUser): User {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function tokenFor(user: User) {
  return `demo:${user.id}`;
}

function userFromRequest(config: AxiosRequestConfig, db: DemoDatabase) {
  const auth = String(config.headers?.Authorization || config.headers?.authorization || '');
  const userId = auth.replace(/^Bearer\s+demo:/i, '');
  return db.users.find((user) => user.id === userId) || null;
}

function readBody(data: unknown) {
  if (data instanceof FormData) {
    return Object.fromEntries(data.entries());
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return (data || {}) as Record<string, any>;
}

function enrichProduct(product: Product, db: DemoDatabase) {
  return {
    ...product,
    category_name: db.categories.find((category) => category.id === product.category_id)?.name,
  };
}

function withItems(order: Order, db: DemoDatabase) {
  return {
    ...order,
    user_name: db.users.find((user) => user.id === order.user_id)?.name,
    user_email: db.users.find((user) => user.id === order.user_id)?.email,
    items: order.items?.map((item) => {
      const product = db.products.find((entry) => entry.id === item.product_id);
      return {
        ...item,
        product_name: product?.name || item.product_name,
        product_image: product?.image_url,
      };
    }) || [],
  };
}

function response<T>(config: AxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return { data, status, statusText: String(status), headers: {}, config: config as any };
}

function fail(config: AxiosRequestConfig, status: number, message: string): never {
  const error: any = new Error(message);
  error.response = response(config, { error: message }, status);
  throw error;
}

function requireUser(config: AxiosRequestConfig, db: DemoDatabase) {
  const user = userFromRequest(config, db);
  if (!user) fail(config, 401, 'Token invalido ou expirado');
  return user!;
}

function buildSummary(db: DemoDatabase) {
  const countBy = (items: Array<{ status: string }>, status: string) => items.filter((item) => item.status === status).length;
  const activeOrders = db.orders.filter((order) => order.status !== 'cancelado');
  return {
    orders: {
      total: db.orders.length,
      pendente: countBy(db.orders, 'pendente'),
      aceito: countBy(db.orders, 'aceito'),
      em_preparo: countBy(db.orders, 'em_preparo'),
      pronto: countBy(db.orders, 'pronto'),
      retirado: countBy(db.orders, 'retirado'),
      cancelado: countBy(db.orders, 'cancelado'),
    },
    products: {
      total: db.products.length,
      disponivel: countBy(db.products, 'disponivel'),
      em_falta: countBy(db.products, 'em_falta'),
      inativo: countBy(db.products, 'inativo'),
    },
    users: {
      total: db.users.length,
      clientes: db.users.filter((user) => user.role === 'cliente').length,
      banidos: db.users.filter((user) => user.is_banned).length,
    },
    revenue: {
      total_revenue: activeOrders.reduce((sum, order) => sum + order.total, 0),
      today_revenue: activeOrders.reduce((sum, order) => sum + order.total, 0),
      month_revenue: activeOrders.reduce((sum, order) => sum + order.total, 0),
    },
  };
}

export const demoAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const db = loadDb();
  const method = (config.method || 'get').toLowerCase();
  const requestUrl = new URL(config.url || '/', 'https://demo.local');
  const path = requestUrl.pathname;
  const body = readBody(config.data);

  if (method === 'post' && path === '/auth/login') {
    const user = db.users.find((item) => item.email === body.email);
    if (!user || user.password !== body.password) fail(config, 401, 'Email ou senha incorretos');
    if (user.is_banned) fail(config, 403, 'Sua conta foi banida. Entre em contato com a cantina.');
    const safeUser = publicUser(user);
    return response(config, { token: tokenFor(safeUser), user: safeUser });
  }

  if (method === 'post' && path === '/auth/register') {
    if (db.users.some((user) => user.email === body.email)) fail(config, 409, 'Email ja cadastrado');
    const user: DemoUser = {
      id: id(),
      name: String(body.name || ''),
      email: String(body.email || ''),
      password: String(body.password || ''),
      role: 'cliente',
      is_banned: false,
      cancel_count: 0,
      created_at: now(),
    };
    db.users.push(user);
    saveDb(db);
    const safeUser = publicUser(user);
    return response(config, { token: tokenFor(safeUser), user: safeUser }, 201);
  }

  if (method === 'get' && path === '/auth/me') {
    return response(config, publicUser(requireUser(config, db)));
  }

  if (method === 'get' && path === '/categories') return response(config, db.categories);

  if (method === 'post' && path === '/categories') {
    const category = { id: id(), name: String(body.name || '').trim() };
    db.categories.push(category);
    saveDb(db);
    return response(config, category, 201);
  }

  if (method === 'delete' && path.startsWith('/categories/')) {
    const parts = path.split('/');
    const categoryId = parts[parts.length - 1];
    db.categories = db.categories.filter((category) => category.id !== categoryId);
    saveDb(db);
    return response(config, { message: 'Categoria excluida' });
  }

  if (method === 'get' && path === '/products') {
    const search = requestUrl.searchParams.get('search')?.toLowerCase();
    let products = db.products.filter((product) => product.status !== 'inativo');
    if (requestUrl.searchParams.get('status')) products = products.filter((product) => product.status === requestUrl.searchParams.get('status'));
    if (requestUrl.searchParams.get('category_id')) products = products.filter((product) => product.category_id === requestUrl.searchParams.get('category_id'));
    if (search) products = products.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(search));
    return response(config, products.map((product) => enrichProduct(product, db)));
  }

  if (method === 'get' && path === '/products/all') {
    return response(config, db.products.map((product) => enrichProduct(product, db)));
  }

  if (method === 'post' && path === '/products') {
    const categoryId = body.category_id ? String(body.category_id) : undefined;
    const quantity = Number(body.quantity || 0);
    const product: Product = {
      id: id(),
      name: String(body.name || ''),
      description: String(body.description || ''),
      price: Number(body.price || 0),
      quantity,
      status: String(body.status || (quantity > 0 ? 'disponivel' : 'em_falta')) as Product['status'],
      category_id: categoryId,
      category_name: db.categories.find((category) => category.id === categoryId)?.name,
      created_at: now(),
      updated_at: now(),
    };
    db.products.push(product);
    saveDb(db);
    return response(config, enrichProduct(product, db), 201);
  }

  const productMatch = path.match(/^\/products\/([^/]+)(?:\/status)?$/);
  if (productMatch) {
    const product = db.products.find((item) => item.id === productMatch[1]);
    if (!product) fail(config, 404, 'Produto nao encontrado');

    if (method === 'put') {
      product.name = String(body.name || product.name);
      product.description = String(body.description ?? product.description ?? '');
      product.price = Number(body.price ?? product.price);
      product.quantity = Number(body.quantity ?? product.quantity);
      product.status = String(body.status || product.status) as Product['status'];
      product.category_id = body.category_id ? String(body.category_id) : undefined;
      product.updated_at = now();
      saveDb(db);
      return response(config, enrichProduct(product, db));
    }

    if (method === 'patch' && path.endsWith('/status')) {
      product.status = String(body.status) as Product['status'];
      product.updated_at = now();
      saveDb(db);
      return response(config, enrichProduct(product, db));
    }

    if (method === 'delete') {
      db.products = db.products.filter((item) => item.id !== product.id);
      saveDb(db);
      return response(config, { message: 'Produto excluido com sucesso' });
    }
  }

  if (method === 'get' && path === '/orders') {
    const user = requireUser(config, db);
    const status = requestUrl.searchParams.get('status');
    let orders = user.role === 'cliente' ? db.orders.filter((order) => order.user_id === user.id) : db.orders;
    if (status) orders = orders.filter((order) => order.status === status);
    return response(config, orders.slice().reverse().map((order) => withItems(order, db)));
  }

  if (method === 'post' && path === '/orders') {
    const user = requireUser(config, db);
    if (user.is_banned) fail(config, 403, 'Sua conta esta banida');
    const items = Array.isArray(body.items) ? body.items : [];
    const orderItems: OrderItem[] = items.map((item: any) => {
      const product = db.products.find((entry) => entry.id === item.product_id);
      if (!product) fail(config, 400, `Produto ${item.product_id} nao encontrado`);
      if (product.status !== 'disponivel') fail(config, 400, `Produto "${product.name}" nao esta disponivel`);
      if (product.quantity < Number(item.quantity)) fail(config, 400, `Quantidade insuficiente para "${product.name}"`);
      const quantity = Number(item.quantity);
      product.quantity -= quantity;
      if (product.quantity <= 0) product.status = 'em_falta';
      product.updated_at = now();
      return {
        id: id(),
        order_id: '',
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity,
        unit_price: product.price,
        subtotal: product.price * quantity,
      };
    });
    const orderId = id();
    const order: Order = {
      id: orderId,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      status: 'pendente',
      total: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
      notes: String(body.notes || ''),
      items: orderItems.map((item) => ({ ...item, order_id: orderId })),
      created_at: now(),
      updated_at: now(),
    };
    db.orders.push(order);
    saveDb(db);
    return response(config, withItems(order, db), 201);
  }

  const orderStatusMatch = path.match(/^\/orders\/([^/]+)\/status$/);
  if (method === 'patch' && orderStatusMatch) {
    const user = requireUser(config, db);
    const order = db.orders.find((item) => item.id === orderStatusMatch[1]);
    if (!order) fail(config, 404, 'Pedido nao encontrado');
    const previousStatus = order.status;
    const nextStatus = String(body.status) as Order['status'];
    order.status = nextStatus;
    order.cancel_reason = nextStatus === 'cancelado' ? String(body.cancel_reason || 'Cancelado pela cantina') : body.cancel_reason;
    order.cancelled_by = nextStatus === 'cancelado' ? user.role : order.cancelled_by;
    order.updated_at = now();
    if (nextStatus === 'cancelado' && previousStatus !== 'cancelado') {
      order.items?.forEach((item) => {
        const product = db.products.find((entry) => entry.id === item.product_id);
        if (product) {
          product.quantity += item.quantity;
          if (product.status === 'em_falta') product.status = 'disponivel';
          product.updated_at = now();
        }
      });
    }
    saveDb(db);
    return response(config, withItems(order, db));
  }

  const orderCancelMatch = path.match(/^\/orders\/([^/]+)\/cancel$/);
  if (method === 'patch' && orderCancelMatch) {
    const user = requireUser(config, db);
    const order = db.orders.find((item) => item.id === orderCancelMatch[1]);
    if (!order) fail(config, 404, 'Pedido nao encontrado');
    if (order.status === 'cancelado') fail(config, 400, 'Pedido ja cancelado');
    order.status = 'cancelado';
    order.cancelled_by = user.role;
    order.cancel_reason = String(body.cancel_reason || 'Cancelado pelo cliente');
    order.updated_at = now();
    if (user.role === 'cliente') user.cancel_count += 1;
    order.items?.forEach((item) => {
      const product = db.products.find((entry) => entry.id === item.product_id);
      if (product) {
        product.quantity += item.quantity;
        if (product.status === 'em_falta') product.status = 'disponivel';
        product.updated_at = now();
      }
    });
    saveDb(db);
    return response(config, { message: 'Pedido cancelado com sucesso' });
  }

  if (method === 'get' && path === '/notifications/unread-count') return response(config, { count: 0 });
  if (method === 'get' && path === '/notifications') return response(config, []);
  if (method === 'patch' && path.startsWith('/notifications/')) return response(config, { message: 'Notificacao marcada como lida' });

  if (method === 'get' && path === '/users') return response(config, db.users.map(publicUser));

  const userBanMatch = path.match(/^\/users\/([^/]+)\/ban$/);
  if (method === 'patch' && userBanMatch) {
    const user = db.users.find((item) => item.id === userBanMatch[1]);
    if (!user) fail(config, 404, 'Usuario nao encontrado');
    user.is_banned = Boolean(body.is_banned);
    saveDb(db);
    return response(config, publicUser(user));
  }

  const userOrdersMatch = path.match(/^\/users\/([^/]+)\/orders$/);
  if (method === 'get' && userOrdersMatch) {
    return response(config, db.orders.filter((order) => order.user_id === userOrdersMatch[1]).map((order) => withItems(order, db)));
  }

  if (method === 'get' && path === '/reports/summary') return response(config, buildSummary(db));
  if (method === 'get' && path === '/reports/peak-hours') {
    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, order_count: 0, total_revenue: 0 }));

    db.orders.forEach((order) => {
      if (order.status !== 'retirado') return;

      const pickedUpAt = new Date(order.updated_at);
      if (Number.isNaN(pickedUpAt.getTime())) return;

      const hour = pickedUpAt.getHours();
      hours[hour].order_count += 1;
      hours[hour].total_revenue += order.total;
    });

    return response(config, hours);
  }
  if (method === 'get' && path === '/reports/cancellations') {
    const cancellations = new Map<string, { product: Product; cancel_count: number; total_value_cancelled: number }>();

    db.orders.forEach((order) => {
      if (order.status !== 'cancelado') return;
      order.items?.forEach((item) => {
        const product = db.products.find((entry) => entry.id === item.product_id);
        if (!product) return;

        const current = cancellations.get(product.id) || { product, cancel_count: 0, total_value_cancelled: 0 };
        current.cancel_count += 1;
        current.total_value_cancelled += item.subtotal;
        cancellations.set(product.id, current);
      });
    });

    return response(config, Array.from(cancellations.values())
      .map((entry) => ({
        ...entry.product,
        cancel_count: entry.cancel_count,
        total_value_cancelled: entry.total_value_cancelled,
      }))
      .sort((a, b) => (
        b.cancel_count - a.cancel_count
        || b.total_value_cancelled - a.total_value_cancelled
        || a.name.localeCompare(b.name)
      )));
  }
  if (method === 'get' && path === '/reports/top-products') {
    const sold = new Map<string, { product: Product; total_sold: number; total_revenue: number; order_count: number }>();
    db.orders.forEach((order) => {
      if (order.status === 'cancelado') return;
      order.items?.forEach((item) => {
        const product = db.products.find((entry) => entry.id === item.product_id);
        if (!product) return;
        const current = sold.get(product.id) || { product, total_sold: 0, total_revenue: 0, order_count: 0 };
        current.total_sold += item.quantity;
        current.total_revenue += item.subtotal;
        current.order_count += 1;
        sold.set(product.id, current);
      });
    });
    const limit = Number(requestUrl.searchParams.get('limit') || 0);
    const topProducts = Array.from(sold.values())
      .map((entry) => ({
        ...entry.product,
        total_sold: entry.total_sold,
        total_revenue: entry.total_revenue,
        order_count: entry.order_count,
      }))
      .sort((a, b) => (
        b.total_sold - a.total_sold
        || b.total_revenue - a.total_revenue
        || a.name.localeCompare(b.name)
      ));

    return response(config, limit > 0 ? topProducts.slice(0, limit) : topProducts);
  }

  return fail(config, 404, 'Rota demo nao encontrada');
};
