import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';

import { initSocket } from './socket';

import authRoutes          from './routes/auth';
import categoriesRoutes    from './routes/categories';
import productsRoutes      from './routes/products';
import ordersRoutes        from './routes/orders';
import notificationsRoutes from './routes/notifications';
import usersRoutes         from './routes/users';
import reportsRoutes       from './routes/reports';

const app = express();
const httpServer = http.createServer(app);

// ─── Middlewares globais ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: curl, Postman) ou origens na lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origem não permitida — ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve imagens de produtos
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/categories',    categoriesRoutes);
app.use('/api/products',      productsRoutes);
app.use('/api/orders',        ordersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/reports',       reportsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Socket.io ───────────────────────────────────────────────────────────────
initSocket(httpServer);

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Banco: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
