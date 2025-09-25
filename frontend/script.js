// === VARIÁVEIS GLOBAIS ===
let currentUser = null;
let authToken = null;
let selectedFile = null;

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function () {
    // Futuramente, podemos verificar o status de login aqui
    setupEventListeners();
});

// === CONFIGURAÇÃO DOS EVENT LISTENERS ===
function setupEventListeners() {
    // Troca de Abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Fechar Modais
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Upload de Arquivo
    const fileDropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('file-input');
    fileDropzone.addEventListener('click', () => fileInput.click());
    fileDropzone.addEventListener('dragover', (e) => { e.preventDefault(); fileDropzone.classList.add('dragover'); });
    fileDropzone.addEventListener('dragleave', () => fileDropzone.classList.remove('dragover'));
    fileDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

// === FUNÇÕES DE UI (INTERFACE DO USUÁRIO) ===
function openLoginModal() { document.getElementById('loginModal').style.display = 'flex'; }
function openRegisterModal() { document.getElementById('registerModal').style.display = 'flex'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

function handleFileSelect(file) {
    selectedFile = file;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-check-btn').disabled = false;
}

// === FUNÇÕES DE VERIFICAÇÃO (SIMULADAS) ===
// Estas funções agora apenas mostram um resultado de exemplo.
// No futuro, elas farão as chamadas reais para o backend.

function checkUrl() {
    const input = document.getElementById('url-input').value;
    const resultsArea = document.getElementById('url-results');
    if (!input) return;
    showLoading(resultsArea, "Analisando URL...");
    setTimeout(() => showResults(resultsArea, { type: 'URL', value: input, risk: 'low' }), 1500);
}

function checkFile() {
    const resultsArea = document.getElementById('file-results');
    if (!selectedFile) return;
    showLoading(resultsArea, "Enviando e analisando arquivo...");
    setTimeout(() => showResults(resultsArea, { type: 'Arquivo', value: selectedFile.name, risk: 'high' }), 2500);
}

function checkText() {
    const input = document.getElementById('text-input').value;
    const resultsArea = document.getElementById('text-results');
    if (!input) return;
    showLoading(resultsArea, "Analisando conteúdo do texto...");
    setTimeout(() => showResults(resultsArea, { type: 'Texto', value: `"${input.substring(0, 30)}..."`, risk: 'medium' }), 2000);
}

// === FUNÇÕES DE EXIBIÇÃO DE RESULTADOS (SIMULADAS) ===
function showLoading(resultsArea, message) {
    resultsArea.style.display = 'block';
    resultsArea.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function showResults(resultsArea, result) {
    const riskText = { low: 'Baixo', medium: 'Médio', high: 'Alto' };
    resultsArea.innerHTML = `
        <h3>Resultado da Análise</h3>
        <div class="result-item">
            <span>Item Verificado:</span>
            <strong>${result.value}</strong>
        </div>
        <div class="result-item">
            <span>Nível de Risco:</span>
            <span class="risk-indicator risk-${result.risk}">${riskText[result.risk]}</span>
        </div>
        <div class="result-item">
            <span>Verificação de Phishing:</span>
            <strong style="color: var(--accent-green)">OK</strong>
        </div>
        <div class="result-item">
            <span>Verificação de Malware:</span>
            <strong style="color: ${result.risk === 'high' ? 'var(--risk-high)' : 'var(--accent-green)'}">
                ${result.risk === 'high' ? 'AMEAÇA ENCONTRADA' : 'OK'}
            </strong>
        </div>
    `;
}

// === FUNÇÕES DE AUTENTICAÇÃO (AINDA SIMULADAS) ===
function logout() {
    // Lógica de logout virá aqui
    alert("Função de Logout chamada!");
}
