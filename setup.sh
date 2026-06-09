#!/bin/bash

# 📋 CHECKLIST DE SETUP DO BACKEND TIERLIST

echo "🚀 TierList Backend - Setup Checklist"
echo "======================================"
echo ""

# 1. Verificar Node.js
echo "1️⃣  Verificando Node.js..."
if command -v node &> /dev/null; then
    echo "   ✅ Node.js $(node --version) instalado"
else
    echo "   ❌ Node.js não está instalado"
    exit 1
fi

# 2. Verificar npm
echo ""
echo "2️⃣  Verificando npm..."
if command -v npm &> /dev/null; then
    echo "   ✅ npm $(npm --version) instalado"
else
    echo "   ❌ npm não está instalado"
    exit 1
fi

# 3. Verificar se .env existe
echo ""
echo "3️⃣  Verificando arquivo .env..."
if [ -f .env ]; then
    echo "   ✅ Arquivo .env encontrado"
else
    echo "   ⚠️  Arquivo .env não encontrado"
    echo "   💡 Execute: cp .env.example .env"
fi

# 4. Verificar PostgreSQL
echo ""
echo "4️⃣  Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "   ✅ PostgreSQL instalado"
else
    echo "   ⚠️  PostgreSQL não encontrado (mas pode estar em Docker/cloud)"
fi

# 5. Instalar dependências
echo ""
echo "5️⃣  Instalando dependências..."
npm install

# 6. Gerar Prisma Client
echo ""
echo "6️⃣  Gerando Prisma Client..."
npm run prisma:generate

# 7. Executar lint
echo ""
echo "7️⃣  Verificando erros de TypeScript..."
npm run lint
if [ $? -eq 0 ]; then
    echo "   ✅ Nenhum erro de TypeScript!"
else
    echo "   ⚠️  Corriga os erros acima"
    exit 1
fi

# 8. Build
echo ""
echo "8️⃣  Compilando TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "   ✅ Build bem-sucedido!"
else
    echo "   ❌ Build falhou"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Setup concluído com sucesso!"
echo ""
echo "📚 Próximos passos:"
echo "   1. Edite o arquivo .env com suas credenciais"
echo "   2. Certifique-se de que PostgreSQL está rodando"
echo "   3. Execute: npm run prisma:migrate"
echo "   4. Inicie o servidor com: npm run dev"
echo ""
echo "📖 Documentação: http://localhost:3001/docs"
echo "======================================"
