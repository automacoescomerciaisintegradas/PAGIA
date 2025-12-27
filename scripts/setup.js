import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

async function run() {
  log("\n🚀 Iniciando o instalador do PAGIA...", colors.bright + colors.magenta);

  // 1. Verificar Node.js
  log("\n🔍 Verificando ambiente...", colors.cyan);
  try {
    const nodeVersion = process.version;
    log(`✅ Node.js detectado: ${nodeVersion}`);
  } catch (e) {
    log("❌ Node.js não encontrado. Por favor, instale o Node.js v18 ou superior.", colors.red);
    process.exit(1);
  }

  // 2. Instalar dependências
  log("\n📦 Instalando dependências (isso pode levar um minuto)...", colors.cyan);
  try {
    execSync('npm install', { stdio: 'inherit', cwd: rootDir });
    log("✅ Dependências instaladas com sucesso.");
  } catch (e) {
    log("❌ Erro ao instalar dependências.", colors.red);
    process.exit(1);
  }

  // 3. Configurar .env
  log("\n⚙️ Configurando variáveis de ambiente...", colors.cyan);
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log("✅ Arquivo .env criado a partir do .env.example.");
      log("⚠️  Lembre-se de editar o arquivo .env com suas chaves de API!", colors.yellow);
    } else {
      log("❌ Arquivo .env.example não encontrado para configurar o ambiente.", colors.red);
    }
  } else {
    log("ℹ️  Arquivo .env já existe, pulando criação.");
  }

  // 4. Build do projeto
  log("\n🏗️  Construindo o projeto...", colors.cyan);
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
    log("✅ Build concluído com sucesso.");
  } catch (e) {
    log("❌ Erro ao construir o projeto.", colors.red);
    process.exit(1);
  }

  // 5. Vincular comando global
  log("\n🔗 Vinculando comando 'pagia' globalmente...", colors.cyan);
  try {
    // Tenta npm link (pode precisar de sudo no Linux)
    const isWindows = process.platform === 'win32';
    const linkCmd = isWindows ? 'npm link' : 'sudo npm link';
    
    log(`Executando: ${linkCmd}`);
    execSync(linkCmd, { stdio: 'inherit', cwd: rootDir });
    log("✅ Comando 'pagia' agora está disponível globalmente!");
  } catch (e) {
    log("\n⚠️  Não foi possível vincular o comando global automaticamente.", colors.yellow);
    log("Você pode rodar manualmente: npm link", colors.bright);
  }

  log("\n✨ Instalação concluída com sucesso! ✨", colors.bright + colors.green);
  log("\nPara começar, configure seu .env e digite:", colors.white);
  log("pagia --help", colors.bright + colors.cyan);
  log("\n==========================================\n", colors.magenta);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
