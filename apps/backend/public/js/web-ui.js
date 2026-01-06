let isLoading = false;
let currentProvider = '';
let currentModel = '';

// Configure marked
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true
});

// Load providers
async function loadProviders() {
    try {
        const res = await fetch('/api/router');
        const data = await res.json();

        const select = document.getElementById('providerSelect');
        select.innerHTML = '';

        data.providers.forEach(p => {
            p.models.forEach(m => {
                const option = document.createElement('option');
                option.value = p.name + '/' + m;
                option.textContent = p.name + '/' + m;
                if (p.name === data.router.default.provider && m === data.router.default.model) {
                    option.selected = true;
                    currentProvider = p.name;
                    currentModel = m;
                }
                select.appendChild(option);
            });
        });

        select.onchange = () => {
            const [p, m] = select.value.split('/');
            currentProvider = p;
            currentModel = m;
        };
    } catch (e) {
        console.error('Failed to load providers:', e);
    }
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function sendSuggestion(text) {
    document.getElementById('messageInput').value = text;
    sendMessage();
}

function showView(view) {
    const chatView = document.getElementById('chatContainer').parentElement;
    const maestroView = document.getElementById('maestroView');
    const menuChat = document.getElementById('menu-chat');
    const menuMaestro = document.getElementById('menu-maestro');

    if (view === 'chat') {
        chatView.classList.remove('hidden');
        chatView.style.display = 'flex';
        maestroView.style.display = 'none';
        menuChat.classList.add('active');
        menuMaestro.classList.remove('active');
    } else if (view === 'maestro') {
        chatView.classList.add('hidden');
        chatView.style.display = 'none';
        maestroView.style.display = 'flex';
        menuChat.classList.remove('active');
        menuMaestro.classList.add('active');
    }
}

function showDocs() {
    window.open('https://github.com/automacoescomerciaisintegradas/PAGIA#readme', '_blank');
}

function showProviders() {
    alert('Use o seletor no topo para trocar de provedor/modelo.\n\nOu execute: pagia router status');
}

async function generateVibe() {
    const description = document.getElementById('vibeDescription').value.trim();
    const projectName = document.getElementById('vibeProjectName').value.trim();
    const btn = document.getElementById('vibeGenerateBtn');
    const btnText = document.getElementById('vibeBtnText');
    const btnIcon = document.getElementById('vibeBtnIcon');
    const statusPanel = document.getElementById('vibeStatusPanel');
    const log = document.getElementById('vibeLog');
    const mainStatus = document.getElementById('vibeMainStatus');

    if (!projectName) {
        alert('Por favor, informe o nome do projeto.');
        return;
    }

    // Reset and show status
    statusPanel.style.display = 'block';
    log.innerHTML = '';
    btn.disabled = true;
    btnText.textContent = 'Orquestrando...';
    btnIcon.textContent = '⌛';
    mainStatus.textContent = 'Processando';
    mainStatus.className = 'log-msg info';

    function addLog(msg, type = '') {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg ${type}">${msg}</span>`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }

    addLog('Iniciando orquestrador Maestro...', 'info');
    addLog(`Sincronizando ambiente para o projeto: ${projectName}`, 'info');

    try {
        const res = await fetch('/api/vibe/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName, vibe: description }),
        });

        const data = await res.json();

        if (data.error) {
            addLog(`Erro: ${data.error}`, 'error');
            mainStatus.textContent = 'Falha';
            mainStatus.className = 'log-msg error';
        } else {
            addLog('Arquivos de boilerplate gerados com sucesso!', 'success');
            addLog('Configuração do Cloudflare Workers (Wrangler) finalizada.', 'success');
            addLog('Credenciais e chaves de API injetadas automaticamente.', 'success');
            addLog(`Diretório pronto em: ${data.path}`, 'success');
            addLog('---', '');
            addLog('🚀 PRÓXIMOS PASSOS:', 'info');
            addLog(`1. cd ${projectName}`, '');
            addLog('2. npm install', '');
            addLog('3. npm run dev', '');

            mainStatus.textContent = 'Concluído';
            mainStatus.className = 'log-msg success';
            btnIcon.textContent = '✅';
            btnText.textContent = 'Lançamento Concluído';
        }
    } catch (e) {
        addLog('Erro de conexão com o servidor Maestro.', 'error');
        mainStatus.textContent = 'Erro de Rede';
        mainStatus.className = 'log-msg error';
    } finally {
        setTimeout(() => {
            if (mainStatus.textContent !== 'Falha' && mainStatus.textContent !== 'Erro de Rede') {
                // Keep success state for a bit
            } else {
                btn.disabled = false;
                btnText.textContent = 'Tentar Novamente';
                btnIcon.textContent = '🛰️';
            }
        }, 2000);
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message || isLoading) return;

    // Clear welcome screen
    const welcome = document.querySelector('.welcome');
    if (welcome) welcome.remove();

    // Add user message
    addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';

    // Show typing indicator
    isLoading = true;
    const typingEl = addTypingIndicator();
    document.getElementById('sendButton').disabled = true;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                provider: currentProvider,
                model: currentModel,
            }),
        });

        const data = await res.json();

        typingEl.remove();

        if (data.error) {
            addError(data.error);
        } else {
            addMessage('assistant', data.content);
        }

    } catch (e) {
        typingEl.remove();
        addError('Erro de conexão com o servidor.');
    }

    isLoading = false;
    document.getElementById('sendButton').disabled = false;
}

function addMessage(role, content) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'message ' + role;

    const avatar = role === 'user' ? '👤' : '🤖';
    const htmlContent = role === 'assistant' ? marked.parse(content) : escapeHtml(content);

    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${htmlContent}</div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Highlight code blocks
    if (role === 'assistant') {
        div.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    }
}

function addTypingIndicator() {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function addError(message) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'error-message';
    div.innerHTML = '❌ ' + message;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
loadProviders();
document.getElementById('messageInput').focus();
