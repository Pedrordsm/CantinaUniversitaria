const appBasePath = import.meta.env.BASE_URL;

// Mude para true para usar o banco de dados em memória (sem backend)
// Mude para false para conectar ao backend real (PostgreSQL Aiven)
export const config = {
  appBasePath,
  isDemoMode: false,
};
