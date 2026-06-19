// Tipos que espelham exatamente o schema PostgreSQL do cantinadb

export interface DbUser {
  idusuario: number;
  nome: string;
  email: string;
  senha: string;
  funcao: 'cliente' | 'funcionario' | 'gerente';
  eh_banido: boolean;
  qtd_cancelamentos: number | null;
  data_criacao: Date;
}

export interface DbCategory {
  idcategoria: number;
  nome: string;
}

export interface DbProduct {
  idproduto: number;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  // BOOLEAN no banco: true = disponivel, false = em_falta
  situacao: boolean;
  url_foto: string | null;
  fk_idcategoria: number;
  // join
  categoria_nome?: string;
}

export interface DbOrder {
  idpedido: number;
  valor_total: number;
  data_inicio: Date;
  situacao: 'pendente' | 'aceito' | 'em_preparo' | 'pronto' | 'retirado' | 'cancelado';
  data_fim: Date | null;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  fk_idusuario: number;
  // joins
  usuario_nome?: string;
  usuario_email?: string;
}

export interface DbOrderItem {
  iditens_pedido: number;
  quantidade: number;
  nome_produto: string;
  preco_produto: number;
  subtotal: number;
  fk_idproduto: number;
  fk_idpedido: number;
}

export interface DbNotification {
  idnotificacao: number;
  mensagem: string;
  titulo: string;
  tipo: string;
  foi_lida: boolean;
  data_envio: Date;
  fk_idpedido: number | null;
  fk_idusuario: number;
}

// ─── Mapeamento DB → Frontend ─────────────────────────────────────────────────

export function mapUser(row: DbUser) {
  return {
    id: String(row.idusuario),
    name: row.nome,
    email: row.email,
    role: row.funcao,
    is_banned: row.eh_banido,
    cancel_count: row.qtd_cancelamentos ?? 0,
    created_at: row.data_criacao.toISOString(),
  };
}

export function mapCategory(row: DbCategory) {
  return {
    id: String(row.idcategoria),
    name: row.nome,
  };
}

// produto.situacao é BOOLEAN no banco:
//   true  → 'disponivel'
//   false → 'em_falta'
// O status 'inativo' é gerenciado via coluna separada no futuro,
// por ora usamos a lógica: quantidade=0 + situacao=false → em_falta
export function mapProduct(row: DbProduct) {
  let status: 'disponivel' | 'em_falta' | 'inativo';
  if (row.situacao === true) {
    status = 'disponivel';
  } else {
    status = 'em_falta';
  }

  return {
    id: String(row.idproduto),
    name: row.nome,
    description: row.descricao,
    price: Number(row.preco),
    quantity: row.quantidade,
    status,
    image_url: row.url_foto ?? undefined,
    category_id: row.fk_idcategoria ? String(row.fk_idcategoria) : undefined,
    category_name: row.categoria_nome ?? undefined,
    created_at: new Date().toISOString(), // coluna não existe no schema
    updated_at: new Date().toISOString(), // coluna não existe no schema
  };
}

export function mapOrder(row: DbOrder, items: ReturnType<typeof mapOrderItem>[] = []) {
  return {
    id: String(row.idpedido),
    user_id: String(row.fk_idusuario),
    user_name: row.usuario_nome ?? undefined,
    user_email: row.usuario_email ?? undefined,
    status: row.situacao,
    total: Number(row.valor_total),
    notes: row.observacoes ?? undefined,
    cancelled_by: undefined as string | undefined, // coluna não existe no schema
    cancel_reason: row.motivo_cancelamento ?? undefined,
    items,
    created_at: row.data_inicio.toISOString(),
    updated_at: (row.data_fim ?? row.data_inicio).toISOString(),
  };
}

export function mapOrderItem(row: DbOrderItem) {
  return {
    id: String(row.iditens_pedido),
    order_id: String(row.fk_idpedido),
    product_id: String(row.fk_idproduto),
    product_name: row.nome_produto,
    product_image: undefined as string | undefined,
    quantity: row.quantidade,
    unit_price: Number(row.preco_produto),
    subtotal: Number(row.subtotal),
  };
}

export function mapNotification(row: DbNotification) {
  return {
    id: String(row.idnotificacao),
    user_id: String(row.fk_idusuario),
    role: undefined as string | undefined, // coluna não existe no schema
    title: row.titulo,
    message: row.mensagem,
    type: row.tipo,
    order_id: row.fk_idpedido ? String(row.fk_idpedido) : undefined,
    is_read: row.foi_lida,
    created_at: row.data_envio.toISOString(),
  };
}

// JWT payload
export interface JwtPayload {
  userId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}
