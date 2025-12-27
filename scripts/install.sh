#!/bin/bash

# Cores para o output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}      PAGIA - Instalador Automático      ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 1. Verificar se Node.js está instalado
if ! command -v node &> /dev/null
then
    echo -e "${RED}Erro: Node.js não foi encontrado.${NC}"
    echo "Por favor, instale o Node.js v18 ou superior e tente novamente."
    exit 1
fi

# 2. Verificar se Git está instalado
if ! command -v git &> /dev/null
then
    echo -e "${RED}Erro: Git não foi encontrado.${NC}"
    echo "Por favor, instale o Git e tente novamente."
    exit 1
fi

# 3. Nome da pasta do projeto
PROJECT_DIR="PAGIA"

# 4. Clonar o repositório se não estiver na pasta
if [ ! -d ".git" ] && [ ! -d "../.git" ]; then
    echo -e "${BLUE}Clonando repositório...${NC}"
    git clone https://github.com/automacoescomerciaisintegradas/PAGIA.git $PROJECT_DIR
    cd $PROJECT_DIR
else
    echo -e "${GREEN}Ambiente Git detectado.${NC}"
fi

# 5. Executar o script de setup do Node.js
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/setup.js" ]; then
    node "$SCRIPT_DIR/setup.js"
else
    echo -e "${RED}Erro: setup.js não encontrado em $SCRIPT_DIR${NC}"
    exit 1
fi
