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
        ipCheckBtn = document.getElementById('ip-check-btn'),
        ipInput = document.getElementById('ip-input'),
        ipResults = document.getElementById('ip-results'),
        emailInput = document.getElementById('email-input'),
        emailCheckBtn = document.getElementById('email-check-btn'),
        emailResults = document.getElementById('email-results'),
        tabs = document.querySelectorAll('.tab'),
        tabContents = document.querySelectorAll('.tab-content');

    const documentInput = document.getElementById('document-input');
    const documentCheckBtn = document.getElementById('document-check-btn');
    const documentResults = document.getElementById('document-results');

    // ===========================================================
    // === 1. NOVOS SELETORES PARA TELEFONE ===
    // ===========================================================
    const phoneInput = document.getElementById('phone-input');
    const phoneCheckBtn = document.getElementById('phone-check-btn');
    const phoneResults = document.getElementById('phone-results');


    // =================================================================
    // VARIÁVEIS GLOBAIS
    // =================================================================
    const API_BASE_URL = 'http://localhost:5000';
    let selectedFile = null;
    let visitorId = null;

    // =================================================================
    // 2. LÓGICA DE INICIALIZAÇÃO E AUTENTICAÇÃO
    // =================================================================
    const initializeVisitorId = async () => {
        try {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            visitorId = result.visitorId;
            console.log('FingerprintJS Visitor ID:', visitorId);
        } catch (error) {
            console.error('Erro ao inicializar o FingerprintJS:', error);
            visitorId = 'error-generating-id';
        }
    };

    const getVisitorId = async () => {
        if (!visitorId) {
            await initializeVisitorId();
        }
        return visitorId;
    };

    initializeVisitorId();

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

    // --- VERIFICAÇÃO DE URL ---
    urlCheckBtn.addEventListener('click', async () => {
        const url = urlInput.value;
        if (!url) return urlResults.innerHTML = `<p class="error-message">Por favor, insira uma URL.</p>`;
        urlCheckBtn.disabled = true;
        urlCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        urlResults.innerHTML = `<p>Analisando: <strong>${url}</strong></p>`;
        try {
            const res = await fetch(`${API_BASE_URL}/api/check/url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ url, visitorId: await getVisitorId() })
            });
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

    // --- VERIFICAÇÃO DE IP ---
    ipCheckBtn.addEventListener('click', async () => {
        const ip = ipInput.value;
        if (!ip) return ipResults.innerHTML = `<p class="error-message">Por favor, insira um endereço de IP.</p>`;
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) return ipResults.innerHTML = `<p class="error-message">Formato de IP inválido.</p>`;
        ipCheckBtn.disabled = true;
        ipCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        ipResults.innerHTML = `<p>Analisando: <strong>${ip}</strong></p>`;
        try {
            const res = await fetch(`${API_BASE_URL}/api/check/ip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ ip, visitorId: await getVisitorId() })
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

    // --- VERIFICAÇÃO DE EMAIL ---
    emailCheckBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) return emailResults.innerHTML = `<p class="error-message">Por favor, insira um endereço de e-mail.</p>`;
        emailCheckBtn.disabled = true;
        emailCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        emailResults.innerHTML = `<p>Analisando: <strong>${email}</strong></p>`;
        try {
            const res = await fetch(`${API_BASE_URL}/api/check/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ email, visitorId: await getVisitorId() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            displayEmailResults(data);
        } catch (error) {
            console.error('Erro ao verificar e-mail:', error);
            emailResults.innerHTML = `<div class="error-message">Ocorreu um erro: ${error.message}</div>`;
        } finally {
            emailCheckBtn.disabled = false;
            emailCheckBtn.innerHTML = '<i class="fas fa-search"></i> Verificar E-mail';
        }
    });

    // --- VERIFICAÇÃO DE DOCUMENTO ---
    documentCheckBtn.addEventListener('click', async () => {
        const documentValue = documentInput.value.replace(/\D/g, '');
        if (!documentValue) {
            documentResults.innerHTML = `<p class="error-message">Por favor, digite um CPF ou CNPJ.</p>`;
            return;
        }

        documentCheckBtn.disabled = true;
        documentCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        documentResults.innerHTML = `<p>Analisando: <strong>${documentValue}</strong></p>`;

        try {
            const response = await fetch(`${API_BASE_URL}/api/check/document`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    document: documentValue,
                    visitorId: await getVisitorId()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro na verificação.');
            }

            showDocumentResults(documentResults, data);

        } catch (error) {
            documentResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            documentCheckBtn.disabled = false;
            documentCheckBtn.innerHTML = '<i class="fas fa-search"></i> Verificar Documento';
        }
    });

    // ===========================================================
    // === 2. LÓGICA PARA VERIFICAÇÃO DE TELEFONE ===
    // ===========================================================
    phoneCheckBtn.addEventListener('click', async () => {
        const phoneValue = phoneInput.value.trim();
        if (!phoneValue) {
            phoneResults.innerHTML = `<p class="error-message">Por favor, digite um número de telefone.</p>`;
            return;
        }

        if (!/^\+[1-9]\d{1,14}$/.test(phoneValue)) {
            phoneResults.innerHTML = `<p class="error-message">Formato inválido. Use o padrão internacional (ex: +5511999998888).</p>`;
            return;
        }

        phoneCheckBtn.disabled = true;
        phoneCheckBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        phoneResults.innerHTML = `<p>Analisando: <strong>${phoneValue}</strong></p>`;

        try {
            const response = await fetch(`${API_BASE_URL}/api/check/phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    phone: phoneValue,
                    visitorId: await getVisitorId()
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message);
            }

            showPhoneResults(phoneResults, data);

        } catch (error) {
            phoneResults.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
        } finally {
            phoneCheckBtn.disabled = false;
            phoneCheckBtn.innerHTML = '<i class="fas fa-search"></i> Verificar Telefone';
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
            if (r.source === 'URLScan.io' && !r.isSafe && r.screenshot) {
                detailsHtml = `<p><i class="${iconClass}"></i> Veredito malicioso encontrado.</p><div class="screenshot-container"><strong>Screenshot da Página:</strong><a href="${r.screenshot}" target="_blank" title="Clique para ampliar"><img src="${r.screenshot}" alt="Screenshot da página suspeita" style="width:100%; margin-top:10px; border:1px solid #ddd; cursor: pointer;"/></a></div>`;
            }
            urlResults.innerHTML += `<div class="${cardClass}"><h4>${r.source}</h4>${detailsHtml}</div>`;
        });
    }

    function displayIpResults(result) {
        ipResults.innerHTML = '<h3>Resultados da Análise de IP:</h3>';
        const isHighRisk = result.isHighRisk;
        const cardClass = isHighRisk ? 'result-card unsafe' : 'result-card safe';
        const iconClass = isHighRisk ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
        let detailsHtml = `<p><i class="${iconClass}"></i> <strong>Risco:</strong> ${isHighRisk ? 'Alto' : 'Baixo'}</p><ul class="details-list"><li><strong>Pontuação de Fraude:</strong> ${result.details.fraudScore} / 100</li><li><strong>País:</strong> ${result.details.countryCode}</li><li><strong>É Proxy/VPN:</strong> ${result.details.isProxy ? 'Sim' : 'Não'}</li><li><strong>É Tor:</strong> ${result.details.isTor ? 'Sim' : 'Não'}</li><li><strong>Abusos Recentes:</strong> ${result.details.recentAbuse ? 'Sim' : 'Não'}</li></ul>`;
        ipResults.innerHTML += `<div class="${cardClass}"><h4>${result.source}</h4>${detailsHtml}</div>`;
    }

    function displayEmailResults(data) {
        emailResults.innerHTML = `<h3>Análise do E-mail: ${data.email}</h3>`;
        let finalRisk = 'Baixo';
        let riskReasons = [];
        const mb = data.mailboxlayer;
        let mbContent = '';
        if (mb && !mb.error) {
            if (mb.disposable) { finalRisk = 'Alto'; riskReasons.push('O e-mail é de um provedor descartável.'); }
            if (!mb.smtp_check) { if (finalRisk !== 'Alto') finalRisk = 'Médio'; riskReasons.push('A verificação SMTP falhou, o e-mail pode não existir.'); }
            mbContent = `<div class="result-card"><h5><i class="fas fa-shield-alt"></i> Validação Técnica (Mailboxlayer)</h5><p><strong>Formato Válido:</strong> ${mb.format_valid ? 'Sim' : 'Não'}</p><p><strong>E-mail Descartável:</strong> ${mb.disposable ? '<span class="risk-high">Sim</span>' : 'Não'}</p><p><strong>Verificação SMTP:</strong> ${mb.smtp_check ? 'Bem-sucedida' : '<span class="risk-medium">Falhou</span>'}</p><p><strong>Score de Qualidade:</strong> ${mb.score * 100}%</p></div>`;
        } else { mbContent = `<p>Não foi possível obter dados de validação técnica.</p>`; }
        const lc = data.leakcheck;
        let lcContent = '';
        if (lc && lc.success) {
            if (lc.found > 0) {
                if (finalRisk !== 'Alto') finalRisk = 'Médio';
                riskReasons.push(`Encontrado em ${lc.found} vazamento(s) de dados.`);
                lcContent = `<div class="result-card"><h5><i class="fas fa-user-secret"></i> Histórico de Vazamentos (LeakCheck)</h5><p class="risk-medium"><strong>Encontrado em ${lc.found} vazamento(s):</strong></p><ul class="details-list">${lc.sources.map(source => `<li>${source.name} (${source.date})</li>`).join('')}</ul></div>`;
            } else { lcContent = `<div class="result-card"><h5><i class="fas fa-user-secret"></i> Histórico de Vazamentos (LeakCheck)</h5><p class="risk-low"><strong>Ótimo!</strong> Este e-mail não foi encontrado em vazamentos conhecidos.</p></div>`; }
        } else if (lc && lc.limit_reached) { lcContent = `<p class="error-message">Limite diário da API de verificação de vazamentos foi atingido.</p>`; } else { lcContent = `<p>Não foi possível obter dados sobre vazamentos.</p>`; }
        let riskClass = 'safe';
        if (finalRisk === 'Médio') riskClass = 'medium-risk';
        if (finalRisk === 'Alto') riskClass = 'unsafe';
        let summaryCard = `<div class="result-card ${riskClass}"><h4><i class="fas fa-flag"></i> Resumo do Risco</h4><p><strong>Nível de Risco Geral:</strong> ${finalRisk}</p>${riskReasons.length > 0 ? `<ul>${riskReasons.map(r => `<li>${r}</li>`).join('')}</ul>` : '<p>Nenhum indicador de risco significativo encontrado.</p>'}</div>`;
        emailResults.innerHTML += summaryCard + mbContent + lcContent;
    }

    function showDocumentResults(container, data) {
        container.innerHTML = '';
        if (!data.isSafe || !data.details) {
            const errorHTML = `<div class="result-item high-risk"><div class="result-header"><i class="fas fa-times-circle"></i><h4>Inválido ou Não Encontrado</h4></div><div class="result-details"><p>${data.message || 'A consulta não retornou um resultado válido.'}</p></div></div>`;
            container.innerHTML = errorHTML;
            return;
        }
        const details = data.details;
        let resultHTML = `<div class="result-item safe"><div class="result-header"><i class="fas fa-check-circle"></i><h4>Documento Válido</h4></div><div class="result-details"><p><strong>Fonte da Consulta:</strong> ${data.source || 'N/A'}</p></div></div><div class="result-table-container"><h4><i class="fas fa-building"></i> Dados Cadastrais</h4><table class="result-table">`;
        if (details.razao_social) { resultHTML += `<tr><td>Razão Social</td><td>${details.razao_social}</td></tr>`; }
        if (details.nome_fantasia) { resultHTML += `<tr><td>Nome Fantasia</td><td>${details.nome_fantasia || 'Não informado'}</td></tr>`; }
        if (details.cnpj) { resultHTML += `<tr><td>CNPJ</td><td>${details.cnpj}</td></tr>`; }
        if (details.data_inicio_atividade) { resultHTML += `<tr><td>Início da Atividade</td><td>${details.data_inicio_atividade}</td></tr>`; }
        if (details.descricao_situacao_cadastral) {
            const statusClass = details.descricao_situacao_cadastral === 'ATIVA' ? 'status-active' : 'status-inactive';
            resultHTML += `<tr><td>Situação Cadastral</td><td><span class="${statusClass}">${details.descricao_situacao_cadastral}</span></td></tr>`;
        }
        const endereco = `${details.logradouro || ''}, ${details.numero || ''} - ${details.bairro || ''}, ${details.municipio || ''} - ${details.uf || ''}, CEP: ${details.cep || ''}`;
        resultHTML += `<tr><td>Endereço</td><td>${endereco}</td></tr>`;
        if (details.ddd_telefone_1) { resultHTML += `<tr><td>Telefone</td><td>${details.ddd_telefone_1}</td></tr>`; }
        resultHTML += `</table></div>`;
        container.innerHTML = resultHTML;
    }

    // ===========================================================
    // === 3. FUNÇÃO PARA EXIBIR RESULTADOS DE TELEFONE ===
    // ===========================================================
    function showPhoneResults(container, data) {
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
        container.innerHTML = resultHTML;
    }


    // --- VERIFICAÇÃO DE ARQUIVO ---
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
        formData.append('visitorId', await getVisitorId());
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
        fileResults.innerHTML += `<div class="${cardClass}"><h4>${result.source}</h4><p><i class="${iconClass}"></i> ${result.details}</p><ul class="file-stats"><li>Maliciosos: <strong>${result.stats.malicious}</strong></li><li>Suspeitos: <strong>${result.stats.suspicious}</strong></li><li>Inofensivos: <strong>${result.stats.harmless}</strong></li></ul></div>`;
    }

    // --- LÓGICA DAS ABAS ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
});
