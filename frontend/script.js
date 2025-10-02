document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeButtons = document.querySelectorAll('.close-btn');

    // URL
    const urlInput = document.getElementById('url-input');
    const urlCheckBtn = document.getElementById('url-check-btn');
    const urlResults = document.getElementById('url-results');

    // ARQUIVO
    const fileDropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('file-input');
    const fileNameSpan = document.getElementById('file-name');
    const fileCheckBtn = document.getElementById('file-check-btn');
    const fileResults = document.getElementById('file-results');
    let selectedFile = null;

    // --- Lógica de Abas ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tabContents.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    // --- Lógica dos Modais ---
    function openModal(modal) { if (modal) modal.style.display = 'block'; }
    function closeModal(modal) { if (modal) modal.style.display = 'none'; }
    if (loginButton) loginButton.addEventListener('click', () => openModal(loginModal));
    if (registerButton) registerButton.addEventListener('click', () => openModal(registerModal));
    closeButtons.forEach(btn => {
        const parentModal = btn.closest('.modal');
        btn.addEventListener('click', () => closeModal(parentModal));
    });
    window.addEventListener('click', (event) => {
        if (event.target == loginModal) closeModal(loginModal);
        if (event.target == registerModal) closeModal(registerModal);
    });

    // --- Lógica de Verificação de URL ---
    if (urlCheckBtn) {
        urlCheckBtn.addEventListener('click', async () => {
            const url = urlInput.value;
            if (!url) { alert('Por favor, insira uma URL.'); return; }
            urlResults.innerHTML = '<p>Analisando, por favor aguarde...</p>';
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3000/api/check/url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                    body: JSON.stringify({ url: url })
                });
                if (!response.ok) throw new Error('A resposta da rede não foi OK.');
                const results = await response.json();
                displayResults(results, urlResults);
            } catch (error) {
                console.error('Erro ao verificar URL:', error);
                urlResults.innerHTML = `<p class="error">Ocorreu um erro ao verificar a URL.</p>`;
            }
        });
    }

    // --- Lógica para Verificação de Arquivo ---
    if (fileDropzone) {
        fileDropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => handleFileSelect(fileInput.files));
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropzone.addEventListener(eventName, preventDefaults, false);
        });
        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
        fileDropzone.addEventListener('drop', (e) => handleFileSelect(e.dataTransfer.files), false);
    }

    function handleFileSelect(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            fileNameSpan.textContent = selectedFile.name;
            fileCheckBtn.disabled = false;
        }
    }

    if (fileCheckBtn) {
        fileCheckBtn.addEventListener('click', async () => {
            if (!selectedFile) { alert('Por favor, selecione um arquivo.'); return; }
            fileResults.innerHTML = '<p>Enviando e analisando o arquivo, isso pode levar um minuto...</p>';
            fileCheckBtn.disabled = true;
            const formData = new FormData();
            formData.append('file', selectedFile);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3000/api/check/file', {
                    method: 'POST',
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                    body: formData
                });
                if (!response.ok) throw new Error('A resposta da rede não foi OK.');
                const result = await response.json();
                displayResults([result], fileResults);
            } catch (error) {
                console.error('Erro ao verificar arquivo:', error);
                fileResults.innerHTML = `<p class="error">Ocorreu um erro ao verificar o arquivo.</p>`;
            } finally {
                fileCheckBtn.disabled = false;
            }
        });
    }

    // --- Função Genérica para Exibir Resultados ---
    function displayResults(results, container) {
        container.innerHTML = '<h3>Resultados da Análise:</h3>';
        if (!Array.isArray(results)) results = [results];
        results.forEach(result => {
            const isSafeClass = result.isSafe ? 'safe' : 'unsafe';
            const resultCard = `
                <div class="result-card ${isSafeClass}">
                    <h4>${result.source}</h4>
                    <p><strong>Status:</strong> ${result.isSafe ? 'Seguro' : 'Perigoso'}</p>
                    <p><strong>Detalhes:</strong> ${result.details || result.error}</p>
                </div>
            `;
            container.innerHTML += resultCard;
        });
    }
});
