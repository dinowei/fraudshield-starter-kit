document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. SELETORES DE ELEMENTOS
    // =================================================================
    const loginButton = document.getElementById('login-button'),
        registerButton = document.getElementById('register-button'),
        logoutButton = document.getElementById('logout-button'),
        loginModal = document.getElementById('loginModal'),
        registerModal = document.getElementById('registerModal'),
        closeButtons = document.querySelectorAll('.close-btn'),
        authButtons = document.getElementById('authButtons'),
        userInfo = document.getElementById('userInfo'),
        userNameSpan = document.getElementById('userName'),
        registerForm = document.getElementById('registerForm'),
        registerMessage = document.getElementById('register-message'),
        loginForm = document.getElementById('loginForm'),
        loginMessage = document.getElementById('login-message'),
        urlCheckBtn = document.getElementById('url-check-btn'),
        urlInput = document.getElementById('url-input'),
        urlResults = document.getElementById('url-results'),
        fileCheckBtn = document.getElementById('file-check-btn'),
        fileInput = document.getElementById('file-input'),
        fileDropzone = document.getElementById('file-dropzone'),
        fileNameSpan = document.getElementById('file-name'),
        fileResults = document.getElementById('file-results'),
        // NOVOS SELETORES PARA IP (com a vírgula corrigida)
        ipCheckBtn = document.getElementById('ip-check-btn'),
        ipInput = document.getElementById('ip-input'),
        ipResults = document.getElementById('ip-results'),
        // SELETORES DE ABAS
        tabs = document.querySelectorAll('.tab'),
        tabContents = document.querySelectorAll('.tab-content');

    const API_BASE_URL = 'http://localhost:5000';
    let selectedFile = null;

    // =================================================================
    // 2. LÓGICA DE AUTENTICAÇÃO E UI (Seu código original, sem alterações )
    // =================================================================
    // ... (Toda a sua lógica de login, registro, modais, etc., permanece aqui, intacta)
    const showLoggedInState = name => {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userNameSpan.textContent = `Olá, ${name}`;
    };
    const showLoggedOutState = () => {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
    };
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    if (token && userName) showLoggedInState(userName);
    const openModal = modalId => document.getElementById(modalId).style.display = 'flex';
    const closeModal = modalId => document.getElementById(modalId).style.display = 'none';
    loginButton.addEventListener('click', () => openModal('loginModal'));
    registerButton.addEventListener('click', () => openModal('registerModal'));
    logoutButton.addEventListener('click', () => {
        showLoggedOutState();
        window.location.reload();
    });
    closeButtons.forEach(btn => btn.addEventListener('click', () => (closeModal('loginModal'), closeModal('registerModal'))));
    window.addEventListener('click', e => {
        if (e.target === loginModal) closeModal('loginModal');
        if (e.target === registerModal) closeModal('registerModal');
    });
    registerForm.addEventListener('submit', handleAuthForm(registerForm, `${API_BASE_URL}/api/auth/register`, registerMessage, true));
    loginForm.addEventListener('submit', handleAuthForm(loginForm, `${API_BASE_URL}/api/auth/login`, loginMessage, false));
    function handleAuthForm(form, url, msgEl, isRegister) {
        return async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());
            msgEl.textContent = '';
            msgEl.className = 'message';
            try {
                const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                if (isRegister) {
                    msgEl.textContent = 'Conta criada! Redirecionando...';
                    msgEl.classList.add('success');
                    setTimeout(() => { closeModal('registerModal'); openModal('loginModal'); }, 2000);
                } else {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('userName', result.name);
                    showLoggedInState(result.name);
                    closeModal('loginModal');
                }
            } catch (err) {
                msgEl.textContent = err.message;
                msgEl.classList.add('error');
            } finally {
                if (isRegister && typeof hcaptcha !== 'undefined') hcaptcha.reset();
            }
        };
    }

    // =================================================================
    // 3. LÓGICA DAS FUNCIONALIDADES DE ANÁLISE
    // =================================================================

    // --- VERIFICAÇÃO DE URL (Seu código original, com uma pequena correção) ---
    urlCheckBtn.addEventListener('click', async () => {
        const url = urlInput.value;
        const userToken = localStorage.getItem('token');
        if (!url) return urlResults.innerHTML = `<p class="error-message">Por favor, insira uma URL.</p>`;

        urlCheckBtn.disabled = true;
        urlCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        urlResults.innerHTML = `<p>Analisando: <strong>${url}</strong></p>`;
        try {
            const res = await fetch(`${API_BASE_URL}/api/check/url`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ url }) });
            const results = await res.json();
            if (!res.ok) throw new Error(results.message);
            displayUrlResults(results);
        } catch (err) {
            urlResults.innerHTML = `<p class="error-message">Erro: ${err.message}</p>`;
        } finally {
            urlCheckBtn.disabled = false;
            urlCheckBtn.innerHTML = '<i class="fas fa-search"></i> Verificar URL';
        }
    });

    // --- NOVA VERIFICAÇÃO DE IP ---
    ipCheckBtn.addEventListener('click', async () => {
        const ip = ipInput.value;
        const userToken = localStorage.getItem('token');

        if (!ip) {
            return ipResults.innerHTML = `<p class="error-message">Por favor, insira um endereço de IP.</p>`;
        }
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
            return ipResults.innerHTML = `<p class="error-message">Formato de IP inválido.</p>`;
        }

        ipCheckBtn.disabled = true;
        ipCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        ipResults.innerHTML = `<p>Analisando: <strong>${ip}</strong></p>`;

        try {
            const res = await fetch(`${API_BASE_URL}/api/check/ip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify({ ip })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            displayIpResults(result);
        } catch (err) {
            ipResults.innerHTML = `<p class="error-message">Erro: ${err.message}</p>`;
        } finally {
            ipCheckBtn.disabled = false;
            ipCheckBtn.innerHTML = '<i class="fas fa-search"></i> Verificar IP';
        }
    });

    // --- FUNÇÕES DE DISPLAY DE RESULTADOS ---

    function displayUrlResults(results) {
        urlResults.innerHTML = '<h3>Resultados da Análise de URL:</h3>';
        if (!results || !Array.isArray(results) || results.length === 0) {
            return urlResults.innerHTML += '<p>Nenhum resultado retornado.</p>';
        }
        results.forEach(r => {
            const cardClass = r.isSafe ? 'result-card safe' : 'result-card unsafe';
            const iconClass = r.isSafe ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
            let detailsHtml = `<p><i class="${iconClass}"></i> ${r.details}</p>`;

            // Lógica para mostrar o screenshot do URLScan.io
            if (r.source === 'URLScan.io' && !r.isSafe && r.screenshot) {
                detailsHtml = `
                    <p><i class="${iconClass}"></i> Veredito malicioso encontrado.</p>
                    <div class="screenshot-container">
                        <strong>Screenshot da Página:</strong>
                        <a href="${r.screenshot}" target="_blank" title="Clique para ampliar">
                            <img src="${r.screenshot}" alt="Screenshot da página suspeita" style="width:100%; margin-top:10px; border:1px solid #ddd; cursor: pointer;"/>
                        </a>
                    </div>
                `;
            }

            urlResults.innerHTML += `
                <div class="${cardClass}">
                    <h4>${r.source}</h4>
                    ${detailsHtml}
                </div>
            `;
        });
    }

    function displayIpResults(result) {
        ipResults.innerHTML = '<h3>Resultados da Análise de IP:</h3>';
        const isHighRisk = result.isHighRisk;
        const cardClass = isHighRisk ? 'result-card unsafe' : 'result-card safe';
        const iconClass = isHighRisk ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';

        let detailsHtml = `
            <p><i class="${iconClass}"></i> <strong>Risco:</strong> ${isHighRisk ? 'Alto' : 'Baixo'}</p>
            <ul class="details-list">
                <li><strong>Pontuação de Fraude:</strong> ${result.details.fraudScore} / 100</li>
                <li><strong>País:</strong> ${result.details.countryCode}</li>
                <li><strong>É Proxy/VPN:</strong> ${result.details.isProxy ? 'Sim' : 'Não'}</li>
                <li><strong>É Tor:</strong> ${result.details.isTor ? 'Sim' : 'Não'}</li>
                <li><strong>Abusos Recentes:</strong> ${result.details.recentAbuse ? 'Sim' : 'Não'}</li>
            </ul>
        `;

        ipResults.innerHTML += `
            <div class="${cardClass}">
                <h4>${result.source}</h4>
                ${detailsHtml}
            </div>
        `;
    }

    // --- VERIFICAÇÃO DE ARQUIVO (Seu código original, sem alterações) ---
    // ... (Toda a sua lógica de verificação de arquivo permanece aqui, intacta)
    const updateFileUI = file => {
        if (!file) return;
        selectedFile = file;
        fileNameSpan.textContent = file.name;
        fileCheckBtn.disabled = false;
        fileDropzone.classList.add('has-file');
    };
    fileDropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => fileInput.files.length && updateFileUI(fileInput.files[0]));
    fileDropzone.addEventListener('dragover', e => (e.preventDefault(), fileDropzone.classList.add('drag-over')));
    fileDropzone.addEventListener('dragleave', () => fileDropzone.classList.remove('drag-over'));
    fileDropzone.addEventListener('drop', e => {
        e.preventDefault();
        fileDropzone.classList.remove('drag-over');
        e.dataTransfer.files.length && updateFileUI(e.dataTransfer.files[0]);
    });
    fileCheckBtn.addEventListener('click', async () => {
        if (!selectedFile) return alert('Nenhum arquivo selecionado.');
        const userToken = localStorage.getItem('token');
        if (!userToken) { openModal('loginModal'); return fileResults.innerHTML = `<p class="error-message">Faça login para verificar.</p>`; }
        const formData = new FormData();
        formData.append('file', selectedFile);
        fileCheckBtn.disabled = true;
        fileCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        fileResults.innerHTML = `<p>Analisando: <strong>${selectedFile.name}</strong></p>`;
        try {
            const res = await fetch(`${API_BASE_URL}/api/check/file`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` }, body: formData });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            displayFileResults(result);
        } catch (err) {
            fileResults.innerHTML = `<p class="error-message">Erro: ${err.message}</p>`;
        } finally {
            fileCheckBtn.disabled = false;
            fileCheckBtn.innerHTML = '<i class="fas fa-search"></i> Verificar Arquivo';
        }
    });
    function displayFileResults(result) {
        fileResults.innerHTML = '<h3>Resultados da Análise:</h3>';
        const isSafe = result.isSafe;
        const cardClass = isSafe ? 'result-card safe' : 'result-card unsafe';
        const iconClass = isSafe ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
        fileResults.innerHTML += `
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

    // --- LÓGICA DAS ABAS (Seu código original, sem alterações) ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
});
