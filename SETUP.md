# 🎯 TierList Backend

API backend para gerenciamento de Tier Lists colaborativas, construída com **Fastify**, **Prisma** e **PostgreSQL**.

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
- `DATABASE_URL`: URL de conexão PostgreSQL
- `JWT_SECRET` e `JWT_REFRESH_SECRET`: Gere chaves aleatórias
- `CLOUDINARY_*`: Credenciais do Cloudinary para upload
- `COOKIE_SECRET`: Chave para assinatura de cookies

### 3. Gerar Prisma Client

```bash
npm run prisma:generate
```

### 4. Executar Migrações

```bash
npm run prisma:migrate
```

### 5. Rodar em Desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3001`

## 📚 Endpoints Principais

### Autenticação (`/api/auth`)
- `POST /register` - Registrar novo usuário
- `POST /login` - Fazer login
- `POST /refresh` - Renovar access token
- `POST /logout` - Logout
- `GET /me` - Obter dados do usuário autenticado
- `PATCH /me` - Atualizar dados do usuário

### Tier Lists (`/api/tier-lists`)
- `GET /` - Listar tier lists (com filtros e paginação)
- `POST /` - Criar nova tier list
- `GET /:id` - Obter tier list específica
- `PATCH /:id` - Atualizar tier list
- `DELETE /:id` - Deletar tier list

### Categorias (`/api/categories`)
- `POST /tier-lists/:id/categories` - Criar categoria
- `PATCH /categories/:id` - Atualizar categoria
- `DELETE /categories/:id` - Deletar categoria
- `POST /tier-lists/:id/categories/reorder` - Reordenar categorias

### Itens (`/api/items`)
- `POST /tier-lists/:id/items` - Criar item
- `PATCH /items/:id` - Atualizar item
- `DELETE /items/:id` - Deletar item
- `POST /tier-lists/:id/items/reorder` - Reordenar itens

### Upload (`/api/upload`)
- `POST /upload/image` - Upload de imagem de item (máx 5MB)
- `POST /upload/theme` - Upload de imagem de tema (máx 10MB)

### Atividades (`/api/activities`)
- `GET /tier-lists/:id/activities` - Listar atividades (com paginação)

## 📖 Documentação Interativa

Acesse o Swagger em: `http://localhost:3001/docs`

## 🗄️ Gerenciamento do Banco de Dados

### Visualizar Dados

```bash
npm run prisma:studio
```

### Executar Migrations

```bash
npm run prisma:migrate
```

### Deploy em Produção

```bash
npm run prisma:migrate:prod
```

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Executar em modo desenvolvimento com hot reload |
| `npm run build` | Compilar TypeScript e gerar Prisma Client |
| `npm run start` | Executar versão compilada |
| `npm run prisma:generate` | Regenerar Prisma Client |
| `npm run prisma:migrate` | Criar/executar migrations |
| `npm run prisma:migrate:prod` | Deploy migrations em produção |
| `npm run prisma:studio` | Abrir interface visual do banco |
| `npm run db:seed` | Popular banco com dados iniciais |
| `npm run lint` | Verificar tipos TypeScript |

## 🛡️ Autenticação

A API utiliza **JWT (JSON Web Tokens)**:

- **Access Token**: Curta duração (15 minutos) no header `Authorization: Bearer <token>`
- **Refresh Token**: Longa duração (7 dias) em cookie `httpOnly`

O middleware `authenticate` protege rotas que requerem autenticação.

## 📤 Upload de Arquivos

Usa **Cloudinary** para armazenar imagens:
- Imagens de itens: até 5MB
- Imagens de tema: até 10MB

Configure o preset de upload unsigned no Cloudinary antes.

## 🐳 Deploy com Docker (opcional)

```bash
docker build -t tierlist-backend .
docker run -p 3001:3001 --env-file .env tierlist-backend
```

## 🚀 Deploy em Produção

### Heroku

```bash
git push heroku main
```

O `Procfile` define automaticamente o comando para iniciar e rodar migrations.

### Vercel (serverless)

Crie um arquivo `vercel.json` para configurar a função serverless.

## 🐛 Troubleshooting

### Erro de conexão com banco de dados
- Verifique se PostgreSQL está rodando
- Confirme a `DATABASE_URL` no `.env`

### Erro ao fazer upload
- Verifique credenciais do Cloudinary
- Confirme o preset de upload está configurado

### Tokens expirando rapidamente
- Aumente `JWT_ACCESS_EXPIRY` se necessário
- Verifique sincronização de relógio do servidor

## 📝 Variáveis de Ambiente

Veja `.env.example` para todas as variáveis necessárias.

## 📄 Licença

ISC
