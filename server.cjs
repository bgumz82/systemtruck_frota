const express = require('express');
const compression = require('compression');
const path = require('path');
const helmet = require('helmet');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Configurar pool de conexão com o banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Testar conexão com o banco
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão com o banco de dados estabelecida com sucesso');
  }
});

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Compressão gzip
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Servir arquivos estáticos com cache
app.use(express.static('dist', {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Criar pasta uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// Servir uploads com cache
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Rotas de autenticação
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log('Tentativa de login para:', email);

    // Verificar se email e senha foram fornecidos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const userResult = await pool.query(`
      SELECT id, email, nome, tipo, ativo, encrypted_password
      FROM usuarios
      WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = userResult.rows[0];

    if (!user.ativo) {
      console.log('Usuário inativo:', email);
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Verificar se o usuário tem senha criptografada
    if (!user.encrypted_password) {
      console.error('Usuário sem senha criptografada:', email);
      return res.status(500).json({ error: 'Erro na configuração do usuário' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.encrypted_password);
    if (!validPassword) {
      console.log('Senha inválida para:', email);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar se JWT_SECRET está definido
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // Gerar token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        tipo: user.tipo
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remover senha do objeto de resposta
    delete user.encrypted_password;

    console.log('Login bem-sucedido para:', email);

    res.json({
      user,
      session: {
        access_token: token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  
  try {
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(`
      SELECT id, email, nome, tipo
      FROM usuarios
      WHERE id = $1 AND ativo = true
    `, [decoded.id]);

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Rota de teste do banco
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', message: 'Conexão com o banco estabelecida' });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Rotas do banco de dados
app.post('/api/db/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    const result = await pool.query(query, params);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error('Erro na consulta:', error);
    res.status(500).json({ error: error.message });
  }
});

// Todas as outras rotas direcionam para o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro Interno do Servidor' });
});

// Iniciar servidor
const server = app.listen(PORT, 'localhost', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Tratamento de sinais para encerramento gracioso
const gracefulShutdown = () => {
  console.log('Iniciando encerramento gracioso...');
  server.close(async () => {
    await pool.end();
    console.log('Servidor encerrado com sucesso');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);