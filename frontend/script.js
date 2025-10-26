/**
 * ============================================================================
 * FRAUDGUARD ENTERPRISE - MAIN JAVASCRIPT
 * Optimized for Performance, Security & Maintainability
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
    // Automatic backend URL detection
    API_BASE_URL: (() => {
        const hostname = window.location.hostname;

        // Production (Vercel)
        if (hostname.includes('vercel.app') || hostname === 'fraudguard.vercel.app') {
            return 'https://fraudshield-starter-kit.onrender.com';
        }

        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }

        // Fallback to production
        return 'https://fraudshield-starter-kit.onrender.com';
    })(),

    // Request timeouts
    TIMEOUT: {
        SHORT: 5000,   // 5 seconds
        MEDIUM: 10000, // 10 seconds
        LONG: 30000    // 30 seconds
    },

    // Validation patterns
    PATTERNS: {
        IP: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        PHONE: /^\+[1-9]\d{1,14}$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
};

console.log('🚀 FraudGuard Enterprise initialized');
console.log('📡 Backend URL:', CONFIG.API_BASE_URL);

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const State = {
    visitorId: null,
    selectedFile: null,
    isAuthenticated: false,
    user: null,

    setVisitorId(id) {
        this.visitorId = id;
    },

    setFile(file) {
        this.selectedFile = file;
    },

    setUser(user, token) {
        this.user = user;
        this.isAuthenticated = true;
        localStorage.setItem('token', token);
        localStorage.setItem('userName', user);
    },

    clearUser() {
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
    },

    loadUser() {
        const token = localStorage.getItem('token');
        const userName = localStorage.getItem('userName');
        if (token && userName) {
            this.user = userName;
            this.isAuthenticated = true;
            return true;
        }
        return false;
    }
};

// ============================================================================
// DOM ELEMENTS CACHE
// ============================================================================

const DOM = {
    // Authentication
    loginButton: null,
    registerButton: null,
    logoutButton: null,
    loginModal: null,
    registerModal: null,
    closeButtons: null,
    authButtons: null,
    userInfo: null,
    userNameSpan: null,
    registerForm: null,
    registerMessage: null,
    loginForm: null,
    loginMessage: null,

    // URL Check
    urlCheckBtn: null,
    urlInput: null,
    urlResults: null,

    // IP Check
    ipCheckBtn: null,
    ipInput: null,
    ipResults: null,

    // Email Check
    emailInput: null,
    emailCheckBtn: null,
    emailResults: null,

    // Document Check
    documentInput: null,
    documentCheckBtn: null,
    documentResults: null,

    // Phone Check
    phoneInput: null,
    phoneCheckBtn: null,
    phoneResults: null,

    // File Check
    fileCheckBtn: null,
    fileInput: null,
    fileDropzone: null,
    fileNameSpan: null,
    fileResults: null,

    // Tabs
    tabs: null,
    tabContents: null,

    initialize() {
        // Authentication elements
        this.loginButton = document.getElementById('login-button');
        this.registerButton = document.getElementById('register-button');
        this.logoutButton = document.getElementById('logout-button');
        this.loginModal = document.getElementById('loginModal');
        this.registerModal = document.getElementById('registerModal');
        this.closeButtons = document.querySelectorAll('.close-btn');
        this.authButtons = document.getElementById('authButtons');
        this.userInfo = document.getElementById('userInfo');
        this.userNameSpan = document.getElementById('userName');
        this.registerForm = document.getElementById('registerForm');
        this.registerMessage = document.getElementById('register-message');
        this.loginForm = document.getElementById('loginForm');
        this.loginMessage = document.getElementById('login-message');

        // Check elements
        this.urlCheckBtn = document.getElementById('url-check-btn');
        this.urlInput = document.getElementById('url-input');
        this.urlResults = document.getElementById('url-results');

        this.ipCheckBtn = document.getElementById('ip-check-btn');
        this.ipInput = document.getElementById('ip-input');
        this.ipResults = document.getElementById('ip-results');

        this.emailInput = document.getElementById('email-input');
        this.emailCheckBtn = document.getElementById('email-check-btn');
        this.emailResults = document.getElementById('email-results');

        this.documentInput = document.getElementById('document-input');
        this.documentCheckBtn = document.getElementById('document-check-btn');
        this.documentResults = document.getElementById('document-results');

        this.phoneInput = document.getElementById('phone-input');
        this.phoneCheckBtn = document.getElementById('phone-check-btn');
        this.phoneResults = document.getElementById('phone-results');

        this.fileCheckBtn = document.getElementById('file-check-btn');
        this.fileInput = document.getElementById('file-input');
        this.fileDropzone = document.getElementById('file-dropzone');
        this.fileNameSpan = document.getElementById('file-name');
        this.fileResults = document.getElementById('file-results');

        this.tabs = document.querySelectorAll('.tab');
        this.tabContents = document.querySelectorAll('.tab-content');
    }
};

// ============================================================================
// API UTILITIES
// ============================================================================

const API = {
    /**
     * Generic API request handler with timeout and error handling
     */
    async request(endpoint, options = {}, timeout = CONFIG.TIMEOUT.MEDIUM) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`✅ API Response from ${endpoint}:`, data);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Requisição cancelada por timeout. Tente novamente.');
            }

            if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
                throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns minutos.');
            }

            console.error(`❌ API Error on ${endpoint}:`, error.message);
            throw error;
        }
    },

    /**
     * File upload request handler
     */
    async uploadFile(endpoint, formData, timeout = CONFIG.TIMEOUT.LONG) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro no upload do arquivo');
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Upload cancelado por timeout. Arquivo muito grande?');
            }

            throw error;
        }
    }
};

// ============================================================================
// FINGERPRINTING & VISITOR ID
// ============================================================================

const Fingerprint = {
    async initialize() {
        try {
            if (typeof FingerprintJS === 'undefined') {
                console.warn('⚠️ FingerprintJS não carregado. Usando ID temporário.');
                State.setVisitorId('temp-' + Date.now());
                return;
            }

            const fp = await FingerprintJS.load();
            const result = await fp.get();
            State.setVisitorId(result.visitorId);
            console.log('🔐 Visitor ID:', result.visitorId);

        } catch (error) {
            console.error('❌ Erro ao inicializar FingerprintJS:', error);
            State.setVisitorId('error-' + Date.now());
        }
    },

    async getVisitorId() {
        if (!State.visitorId) {
            await this.initialize();
        }
        return State.visitorId;
    }
};

// ============================================================================
// AUTHENTICATION MODULE
// ============================================================================

const Auth = {
    showLoggedInState(name) {
        if (!DOM.authButtons || !DOM.userInfo || !DOM.userNameSpan) return;

        DOM.authButtons.style.display = 'none';
        DOM.userInfo.style.display = 'flex';
        DOM.userNameSpan.textContent = `Olá, ${name}`;
    },

    showLoggedOutState() {
        if (!DOM.authButtons || !DOM.userInfo) return;

        DOM.authButtons.style.display = 'flex';
        DOM.userInfo.style.display = 'none';
        State.clearUser();
    },

    async handleRegister(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Validate hCaptcha
        if (typeof hcaptcha !== 'undefined') {
            const hcaptchaResponse = hcaptcha.getResponse();
            if (!hcaptchaResponse) {
                Utils.showMessage(DOM.registerMessage, 'Por favor, complete o captcha.', 'error');
                return;
            }
            userData.hcaptcha = hcaptchaResponse;
        }

        try {
            Utils.showMessage(DOM.registerMessage, 'Criando conta...', '');

            const data = await API.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            Utils.showMessage(DOM.registerMessage, 'Conta criada com sucesso! Redirecionando...', 'success');

            setTimeout(() => {
                Modal.close('registerModal');
                Modal.open('loginModal');
            }, 2000);

        } catch (error) {
            Utils.showMessage(DOM.registerMessage, error.message, 'error');
        } finally {
            if (typeof hcaptcha !== 'undefined') {
                hcaptcha.reset();
            }
        }
    },

    async handleLogin(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            Utils.showMessage(DOM.loginMessage, 'Entrando...', '');

            const data = await API.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            State.setUser(data.name, data.token);
            this.showLoggedInState(data.name);
            Modal.close('loginModal');

            Utils.showMessage(DOM.loginMessage, 'Login realizado com sucesso!', 'success');

        } catch (error) {
            Utils.showMessage(DOM.loginMessage, error.message, 'error');
        }
    },

    logout() {
        this.showLoggedOutState();
        window.location.reload();
    }
};

// ============================================================================
// MODAL MODULE
// ============================================================================

const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    },

    setupCloseHandlers() {
        // Close button handlers
        DOM.closeButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                Modal.close('loginModal');
                Modal.close('registerModal');
            });
        });

        // Click outside to close
        window.addEventListener('click', (e) => {
            if (e.target === DOM.loginModal) Modal.close('loginModal');
            if (e.target === DOM.registerModal) Modal.close('registerModal');
        });
    }
};

// ============================================================================
// CHECK MODULES
// ============================================================================

const Checks = {
    // URL Check
    async url() {
        const url = DOM.urlInput.value.trim();

        if (!url) {
            DOM.urlResults.innerHTML = `<p class="error-message">Por favor, insira uma URL.</p>`;
            return;
        }

        Utils.setLoadingState(DOM.urlCheckBtn, true, 'Verificando...');
        DOM.urlResults.innerHTML = `<p>Analisando: <strong>${url}</strong></p>`;

        try {
            const visitorId = await Fingerprint.getVisitorId();
            const results = await API.request('/api/check/url', {
                method: 'POST',
                body: JSON.stringify({ url, visitorId })
            });

            Renderers.urlResults(results);

        } catch (error) {
            DOM.urlResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            Utils.setLoadingState(DOM.urlCheckBtn, false, 'Verificar URL');
        }
    },

    // IP Check
    async ip() {
        const ip = DOM.ipInput.value.trim();

        if (!ip) {
            DOM.ipResults.innerHTML = `<p class="error-message">Por favor, insira um endereço de IP.</p>`;
            return;
        }

        if (!CONFIG.PATTERNS.IP.test(ip)) {
            DOM.ipResults.innerHTML = `<p class="error-message">Formato de IP inválido.</p>`;
            return;
        }

        Utils.setLoadingState(DOM.ipCheckBtn, true, 'Verificando...');
        DOM.ipResults.innerHTML = `<p>Analisando: <strong>${ip}</strong></p>`;

        try {
            const visitorId = await Fingerprint.getVisitorId();
            const result = await API.request('/api/check/ip', {
                method: 'POST',
                body: JSON.stringify({ ip, visitorId })
            });

            Renderers.ipResults(result);

        } catch (error) {
            DOM.ipResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            Utils.setLoadingState(DOM.ipCheckBtn, false, 'Verificar IP');
        }
    },

    // Email Check
    async email() {
        const email = DOM.emailInput.value.trim();

        if (!email) {
            DOM.emailResults.innerHTML = `<p class="error-message">Por favor, insira um endereço de e-mail.</p>`;
            return;
        }

        Utils.setLoadingState(DOM.emailCheckBtn, true, 'Verificando...');
        DOM.emailResults.innerHTML = `<p>Analisando: <strong>${email}</strong></p>`;

        try {
            const visitorId = await Fingerprint.getVisitorId();
            const data = await API.request('/api/check/email', {
                method: 'POST',
                body: JSON.stringify({ email, visitorId })
            });

            Renderers.emailResults(data);

        } catch (error) {
            DOM.emailResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            Utils.setLoadingState(DOM.emailCheckBtn, false, 'Verificar E-mail');
        }
    },

    // Document Check (CPF/CNPJ)
    async document() {
        const documentValue = DOM.documentInput.value.replace(/\D/g, '');

        if (!documentValue) {
            DOM.documentResults.innerHTML = `<p class="error-message">Por favor, digite um CPF ou CNPJ.</p>`;
            return;
        }

        Utils.setLoadingState(DOM.documentCheckBtn, true, 'Verificando...');
        DOM.documentResults.innerHTML = `<p>Analisando: <strong>${documentValue}</strong></p>`;

        try {
            const visitorId = await Fingerprint.getVisitorId();
            const data = await API.request('/api/check/document', {
                method: 'POST',
                body: JSON.stringify({ document: documentValue, visitorId })
            });

            Renderers.documentResults(data);

        } catch (error) {
            DOM.documentResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            Utils.setLoadingState(DOM.documentCheckBtn, false, 'Verificar Documento');
        }
    },

    // Phone Check
    async phone() {
        const phoneValue = DOM.phoneInput.value.trim();

        if (!phoneValue) {
            DOM.phoneResults.innerHTML = `<p class="error-message">Por favor, digite um número de telefone.</p>`;
            return;
        }

        if (!CONFIG.PATTERNS.PHONE.test(phoneValue)) {
            DOM.phoneResults.innerHTML = `<p class="error-message">Formato inválido. Use o padrão internacional (ex: +5511999998888).</p>`;
            return;
        }

        Utils.setLoadingState(DOM.phoneCheckBtn, true, 'Verificando...');
        DOM.phoneResults.innerHTML = `<p>Analisando: <strong>${phoneValue}</strong></p>`;

        try {
            const visitorId = await Fingerprint.getVisitorId();
            const data = await API.request('/api/check/phone', {
                method: 'POST',
                body: JSON.stringify({ phone: phoneValue, visitorId })
            });

            Renderers.phoneResults(data);

        } catch (error) {
            DOM.phoneResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            Utils.setLoadingState(DOM.phoneCheckBtn, false, 'Verificar Telefone');
        }
    },

    // File Check
    async file() {
        if (!State.selectedFile) {
            alert('Nenhum arquivo selecionado.');
            return;
        }

        const userToken = localStorage.getItem('token');
        if (!userToken) {
            Modal.open('loginModal');
            DOM.fileResults.innerHTML = `<p class="error-message">Faça login para verificar arquivos.</p>`;
            return;
        }

        Utils.setLoadingState(DOM.fileCheckBtn, true, 'Verificando...');
        DOM.fileResults.innerHTML = `<p>Analisando: <strong>${State.selectedFile.name}</strong></p>`;

        try {
            const formData = new FormData();
            formData.append('file', State.selectedFile);
            formData.append('visitorId', await Fingerprint.getVisitorId());

            const result = await API.uploadFile('/api/check/file', formData);
            Renderers.fileResults(result);

        } catch (error) {
            DOM.fileResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            Utils.setLoadingState(DOM.fileCheckBtn, false, 'Verificar Arquivo');
        }
    }
};

// ============================================================================
// RESULT RENDERERS
// ============================================================================

const Renderers = {
    urlResults(results) {
        DOM.urlResults.innerHTML = '<h3>Resultados da Análise de URL:</h3>';

        if (!results || !Array.isArray(results) || results.length === 0) {
            DOM.urlResults.innerHTML += '<p>Nenhum resultado retornado.</p>';
            return;
        }

        results.forEach(r => {
            const cardClass = r.isSafe ? 'result-card safe' : 'result-card unsafe';
            const iconClass = r.isSafe ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';

            let detailsHtml = `<p><i class="${iconClass}"></i> ${r.details}</p>`;

            if (r.source === 'URLScan.io' && !r.isSafe && r.screenshot) {
                detailsHtml = `
                    <p><i class="${iconClass}"></i> Veredito malicioso encontrado.</p>
                    <div class="screenshot-container">
                        <strong>Screenshot da Página:</strong>
                        <a href="${r.screenshot}" target="_blank" rel="noopener noreferrer" title="Clique para ampliar">
                            <img src="${r.screenshot}" alt="Screenshot da página suspeita" 
                                 style="width:100%; margin-top:10px; border:1px solid #ddd; cursor: pointer;" 
                                 loading="lazy"/>
                        </a>
                    </div>
                `;
            }

            DOM.urlResults.innerHTML += `
                <div class="${cardClass}">
                    <h4>${r.source}</h4>
                    ${detailsHtml}
                </div>
            `;
        });
    },

    ipResults(result) {
        DOM.ipResults.innerHTML = '<h3>Resultados da Análise de IP:</h3>';

        const isHighRisk = result.isHighRisk;
        const cardClass = isHighRisk ? 'result-card unsafe' : 'result-card safe';
        const iconClass = isHighRisk ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';

        const detailsHtml = `
            <p><i class="${iconClass}"></i> <strong>Risco:</strong> ${isHighRisk ? 'Alto' : 'Baixo'}</p>
            <ul class="details-list">
                <li><strong>Pontuação de Fraude:</strong> ${result.details.fraudScore} / 100</li>
                <li><strong>País:</strong> ${result.details.countryCode}</li>
                <li><strong>É Proxy/VPN:</strong> ${result.details.isProxy ? 'Sim' : 'Não'}</li>
                <li><strong>É Tor:</strong> ${result.details.isTor ? 'Sim' : 'Não'}</li>
                <li><strong>Abusos Recentes:</strong> ${result.details.recentAbuse ? 'Sim' : 'Não'}</li>
            </ul>
        `;

        DOM.ipResults.innerHTML += `
            <div class="${cardClass}">
                <h4>${result.source}</h4>
                ${detailsHtml}
            </div>
        `;
    },

    emailResults(data) {
        DOM.emailResults.innerHTML = `<h3>Análise do E-mail: ${data.email}</h3>`;

        let finalRisk = 'Baixo';
        let riskReasons = [];

        // Mailboxlayer analysis
        const mb = data.mailboxlayer;
        let mbContent = '';

        if (mb && !mb.error) {
            if (mb.disposable) {
                finalRisk = 'Alto';
                riskReasons.push('O e-mail é de um provedor descartável.');
            }
            if (!mb.smtp_check) {
                if (finalRisk !== 'Alto') finalRisk = 'Médio';
                riskReasons.push('A verificação SMTP falhou, o e-mail pode não existir.');
            }

            mbContent = `
                <div class="result-card">
                    <h5><i class="fas fa-shield-alt"></i> Validação Técnica (Mailboxlayer)</h5>
                    <p><strong>Formato Válido:</strong> ${mb.format_valid ? 'Sim' : 'Não'}</p>
                    <p><strong>E-mail Descartável:</strong> ${mb.disposable ? '<span class="risk-high">Sim</span>' : 'Não'}</p>
                    <p><strong>Verificação SMTP:</strong> ${mb.smtp_check ? 'Bem-sucedida' : '<span class="risk-medium">Falhou</span>'}</p>
                    <p><strong>Score de Qualidade:</strong> ${mb.score * 100}%</p>
                </div>
            `;
        } else {
            mbContent = `<p>Não foi possível obter dados de validação técnica.</p>`;
        }

        // LeakCheck analysis
        const lc = data.leakcheck;
        let lcContent = '';

        if (lc && lc.success) {
            if (lc.found > 0) {
                if (finalRisk !== 'Alto') finalRisk = 'Médio';
                riskReasons.push(`Encontrado em ${lc.found} vazamento(s) de dados.`);

                lcContent = `
                    <div class="result-card">
                        <h5><i class="fas fa-user-secret"></i> Histórico de Vazamentos (LeakCheck)</h5>
                        <p class="risk-medium"><strong>Encontrado em ${lc.found} vazamento(s):</strong></p>
                        <ul class="details-list">
                            ${lc.sources.map(source => `<li>${source.name} (${source.date})</li>`).join('')}
                        </ul>
                    </div>
                `;
            } else {
                lcContent = `
                    <div class="result-card">
                        <h5><i class="fas fa-user-secret"></i> Histórico de Vazamentos (LeakCheck)</h5>
                        <p class="risk-low"><strong>Ótimo!</strong> Este e-mail não foi encontrado em vazamentos conhecidos.</p>
                    </div>
                `;
            }
        } else if (lc && lc.limit_reached) {
            lcContent = `<p class="error-message">Limite diário da API de verificação de vazamentos foi atingido.</p>`;
        } else {
            lcContent = `<p>Não foi possível obter dados sobre vazamentos.</p>`;
        }

        // Risk summary
        let riskClass = 'safe';
        if (finalRisk === 'Médio') riskClass = 'medium-risk';
        if (finalRisk === 'Alto') riskClass = 'unsafe';

        const summaryCard = `
            <div class="result-card ${riskClass}">
                <h4><i class="fas fa-flag"></i> Resumo do Risco</h4>
                <p><strong>Nível de Risco Geral:</strong> ${finalRisk}</p>
                ${riskReasons.length > 0 ? `<ul>${riskReasons.map(r => `<li>${r}</li>`).join('')}</ul>` : '<p>Nenhum indicador de risco significativo encontrado.</p>'}
            </div>
        `;

        DOM.emailResults.innerHTML += summaryCard + mbContent + lcContent;
    },

    documentResults(data) {
        DOM.documentResults.innerHTML = '';

        if (!data.isSafe || !data.details) {
            const errorHTML = `
                <div class="result-item high-risk">
                    <div class="result-header">
                        <i class="fas fa-times-circle"></i>
                        <h4>Inválido ou Não Encontrado</h4>
                    </div>
                    <div class="result-details">
                        <p>${data.message || 'A consulta não retornou um resultado válido.'}</p>
                    </div>
                </div>
            `;
            DOM.documentResults.innerHTML = errorHTML;
            return;
        }

        const details = data.details;
        let resultHTML = `
            <div class="result-item safe">
                <div class="result-header">
                    <i class="fas fa-check-circle"></i>
                    <h4>Documento Válido</h4>
                </div>
                <div class="result-details">
                    <p><strong>Fonte da Consulta:</strong> ${data.source || 'N/A'}</p>
                </div>
            </div>
            <div class="result-table-container">
                <h4><i class="fas fa-building"></i> Dados Cadastrais</h4>
                <table class="result-table">
                    <tbody>
        `;

        if (details.razao_social) {
            resultHTML += `<tr><td>Razão Social</td><td>${details.razao_social}</td></tr>`;
        }
        if (details.nome_fantasia) {
            resultHTML += `<tr><td>Nome Fantasia</td><td>${details.nome_fantasia || 'Não informado'}</td></tr>`;
        }
        if (details.cnpj) {
            resultHTML += `<tr><td>CNPJ</td><td>${details.cnpj}</td></tr>`;
        }
        if (details.data_inicio_atividade) {
            resultHTML += `<tr><td>Início da Atividade</td><td>${details.data_inicio_atividade}</td></tr>`;
        }
        if (details.descricao_situacao_cadastral) {
            const statusClass = details.descricao_situacao_cadastral === 'ATIVA' ? 'status-active' : 'status-inactive';
            resultHTML += `<tr><td>Situação Cadastral</td><td><span class="${statusClass}">${details.descricao_situacao_cadastral}</span></td></tr>`;
        }

        const endereco = `${details.logradouro || ''}, ${details.numero || ''} - ${details.bairro || ''}, ${details.municipio || ''} - ${details.uf || ''}, CEP: ${details.cep || ''}`;
        resultHTML += `<tr><td>Endereço</td><td>${endereco}</td></tr>`;

        if (details.ddd_telefone_1) {
            resultHTML += `<tr><td>Telefone</td><td>${details.ddd_telefone_1}</td></tr>`;
        }

        resultHTML += `
                    </tbody>
                </table>
            </div>
        `;

        DOM.documentResults.innerHTML = resultHTML;
    },

    phoneResults(data) {
        const details = data.details;
        let resultHTML = '';

        if (details.isValid) {
            resultHTML = `
                <div class="result-item safe">
                    <div class="result-header">
                        <i class="fas fa-check-circle"></i>
                        <h4>Telefone Válido</h4>
                    </div>
                </div>
                <div class="result-table-container">
                    <h4><i class="fas fa-info-circle"></i> Detalhes do Número</h4>
                    <table class="result-table">
                        <tbody>
                            <tr>
                                <td>Número Internacional</td>
                                <td>${details.phoneNumber || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Formato Nacional</td>
                                <td>${details.nationalFormat || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>País</td>
                                <td>${details.countryCode || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Operadora</td>
                                <td>${details.carrierName || 'Informação não disponível'}</td>
                            </tr>
                            <tr>
                                <td>Tipo de Linha</td>
                                <td>${details.lineType || 'Informação não disponível'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            resultHTML = `
                <div class="result-item high-risk">
                    <div class="result-header">
                        <i class="fas fa-times-circle"></i>
                        <h4>Telefone Inválido ou Não Encontrado</h4>
                    </div>
                    <div class="result-details">
                        <p>${data.message || 'A verificação falhou. Verifique o número e o formato.'}</p>
                    </div>
                </div>
            `;
        }

        DOM.phoneResults.innerHTML = resultHTML;
    },

    fileResults(result) {
        DOM.fileResults.innerHTML = '<h3>Resultados da Análise:</h3>';

        const isSafe = result.isSafe;
        const cardClass = isSafe ? 'result-card safe' : 'result-card unsafe';
        const iconClass = isSafe ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';

        DOM.fileResults.innerHTML += `
            <div class="${cardClass}">
                <h4>${result.source}</h4>
                <p><i class="${iconClass}"></i> ${result.details}</p>
                <ul class="file-stats">
                    <li>Maliciosos: <strong>${result.stats.malicious}</strong></li>
                    <li>Suspeitos: <strong>${result.stats.suspicious}</strong></li>
                    <li>Inofensivos: <strong>${result.stats.harmless}</strong></li>
                </ul>
            </div>
        `;
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const Utils = {
    showMessage(element, message, type) {
        if (!element) return;

        element.textContent = message;
        element.className = 'message';

        if (type === 'success') element.classList.add('success');
        if (type === 'error') element.classList.add('error');
        if (type === 'warning') element.classList.add('warning');
    },

    setLoadingState(button, isLoading, text) {
        if (!button) return;

        button.disabled = isLoading;

        if (isLoading) {
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        } else {
            button.innerHTML = `<i class="fas fa-search"></i> ${text}`;
        }
    },

    updateFileUI(file) {
        if (!file) return;

        State.setFile(file);
        DOM.fileNameSpan.textContent = file.name;
        DOM.fileCheckBtn.disabled = false;
        DOM.fileDropzone.classList.add('has-file');
    }
};

// ============================================================================
// TAB SYSTEM
// ============================================================================

const Tabs = {
    initialize() {
        if (!DOM.tabs || !DOM.tabContents) return;

        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                DOM.tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });

                DOM.tabContents.forEach(c => {
                    c.classList.remove('active');
                    c.setAttribute('hidden', '');
                });

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                const targetTab = document.getElementById(`tab-${tab.dataset.tab}`);
                if (targetTab) {
                    targetTab.classList.add('active');
                    targetTab.removeAttribute('hidden');
                }
            });
        });
    }
};

// ============================================================================
// FILE DROP HANDLERS
// ============================================================================

const FileHandlers = {
    initialize() {
        if (!DOM.fileDropzone || !DOM.fileInput) return;

        // Click to select
        DOM.fileDropzone.addEventListener('click', () => DOM.fileInput.click());

        // File input change
        DOM.fileInput.addEventListener('change', () => {
            if (DOM.fileInput.files.length) {
                Utils.updateFileUI(DOM.fileInput.files[0]);
            }
        });

        // Drag & Drop
        DOM.fileDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            DOM.fileDropzone.classList.add('drag-over');
        });

        DOM.fileDropzone.addEventListener('dragleave', () => {
            DOM.fileDropzone.classList.remove('drag-over');
        });

        DOM.fileDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            DOM.fileDropzone.classList.remove('drag-over');

            if (e.dataTransfer.files.length) {
                Utils.updateFileUI(e.dataTransfer.files[0]);
            }
        });
    }
};

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

const EventListeners = {
    setup() {
        // Authentication
        DOM.loginButton?.addEventListener('click', () => Modal.open('loginModal'));
        DOM.registerButton?.addEventListener('click', () => Modal.open('registerModal'));
        DOM.logoutButton?.addEventListener('click', () => Auth.logout());

        DOM.registerForm?.addEventListener('submit', (e) => Auth.handleRegister(e));
        DOM.loginForm?.addEventListener('submit', (e) => Auth.handleLogin(e));

        // Checks
        DOM.urlCheckBtn?.addEventListener('click', () => Checks.url());
        DOM.ipCheckBtn?.addEventListener('click', () => Checks.ip());
        DOM.emailCheckBtn?.addEventListener('click', () => Checks.email());
        DOM.documentCheckBtn?.addEventListener('click', () => Checks.document());
        DOM.phoneCheckBtn?.addEventListener('click', () => Checks.phone());
        DOM.fileCheckBtn?.addEventListener('click', () => Checks.file());
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Initializing FraudGuard Enterprise...');

    try {
        // 1. Initialize DOM cache
        DOM.initialize();
        console.log('✅ DOM elements cached');

        // 2. Initialize visitor fingerprint
        await Fingerprint.initialize();
        console.log('✅ Fingerprinting initialized');

        // 3. Load user state
        if (State.loadUser()) {
            Auth.showLoggedInState(State.user);
            console.log('✅ User session restored');
        }

        // 4. Setup event listeners
        EventListeners.setup();
        console.log('✅ Event listeners registered');

        // 5. Setup modals
        Modal.setupCloseHandlers();
        console.log('✅ Modal handlers configured');

        // 6. Setup tabs
        Tabs.initialize();
        console.log('✅ Tab system initialized');

        // 7. Setup file handlers
        FileHandlers.initialize();
        console.log('✅ File handlers configured');

        console.log('🎉 FraudGuard Enterprise ready!');

    } catch (error) {
        console.error('❌ Initialization error:', error);
    }
});
