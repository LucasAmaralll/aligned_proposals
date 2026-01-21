#!/bin/bash

echo "🚀 Iniciando Aligned Proposals..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verifica se está na raiz do projeto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

# Inicia o backend em background
echo -e "${BLUE}📦 Iniciando Backend (porta 5000)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguarda 3 segundos
sleep 3

# Inicia o frontend
echo -e "${GREEN}⚛️  Iniciando Frontend (porta 3000)...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Servidores iniciados!${NC}"
echo ""
echo "📍 Backend:  http://localhost:5000"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "⚠️  Pressione Ctrl+C para parar ambos os servidores"
echo ""

# Função para matar os processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Captura Ctrl+C
trap cleanup INT TERM

# Aguarda indefinidamente
wait
