// Função de Highlighting (Syntax Highlighting)
function updateHighlight(text, keepErrors = false) {
    const resultElement = document.getElementById("highlighting-content");

    // 1. Escapar caracteres HTML básicos
    let content = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // DICIONÁRIO DE CORES (Ordem importa!)
    const rules = [
        { type: 'comment', regex: /##[\s\S]*?##/g },       // Bloco ## ##
        { type: 'comment', regex: /#.*/g },                // Linha #
        { type: 'string', regex: /"(?:\\.|[^"\\])*"/g },  // Strings " "
        { type: 'number', regex: /\b\d+(\.\d+)?\b/g },    // Números
        { type: 'keyword', regex: /\b(VAR|EXIBIR|SE|SENAO|PARA|ENQUANTO|RETORNA|FUNCAO|INSERIR|PARAR|CONTINUAR|propriedades)\b|\+\+|--|\+=|-=/g },
        { type: 'web', regex: /\b(bloco|texto|botao|imagem|titulo|caixa)\b/g },
        { type: 'prop', regex: /\b(fundo|cor|largura|altura|borda|margem|padding)\b/g },
        { type: 'type', regex: /\b(TEXTO|NUMERO|BOOLEANO|LISTA|INTEIRO|REAL|NATURAL|LOGICO)\b/g }
    ];

    // Array para guardar as partes processadas
    let parts = [{ text: content, isToken: false }];

    // Processa cada regra sem sobrepor
    rules.forEach(rule => {
        let newParts = [];
        parts.forEach(part => {
            if (part.isToken) {
                newParts.push(part);
                return;
            }

            let lastIndex = 0;
            part.text.replace(rule.regex, (match, ...args) => {
                const offset = args[args.length - 2];
                // Texto antes do match
                if (offset > lastIndex) {
                    newParts.push({ text: part.text.slice(lastIndex, offset), isToken: false });
                }
                // O match colorido
                newParts.push({
                    text: `<span class="token-${rule.type}">${match}</span>`,
                    isToken: true
                });
                lastIndex = offset + match.length;
            });

            if (lastIndex < part.text.length) {
                newParts.push({ text: part.text.slice(lastIndex), isToken: false });
            }
        });
        parts = newParts;
    });

    // Une todas as partes e aplica ao HTML
    // Une todas as partes e aplica ao HTML
    resultElement.innerHTML = parts.map(p => p.text).join('');

    // Atualiza numeração de linhas
    // Se for edição (user typing), limpamos erros pois o código mudou
    if (!keepErrors) {
        currentErrorLines.clear();
    }
    updateLineNumbers(text);
    updateErrorOverlay(text);
}

let currentErrorLines = new Map(); // Map<Linha, Coluna>

function updateLineNumbers(text) {
    const lineNumbersEle = document.getElementById("line-numbers");
    if (!lineNumbersEle) return;

    const lines = text.split("\n").length;

    lineNumbersEle.innerHTML = Array(lines).fill(0).map((_, i) => {
        const lineNum = i + 1;
        const isError = currentErrorLines.has(lineNum);
        const className = isError ? 'line-error' : '';
        return `<div class="${className}">${lineNum}</div>`;
    }).join('');
}

function syncScroll(el) {
    const pre = document.getElementById("highlighting");
    const lineNumbers = document.getElementById("line-numbers");

    pre.scrollTop = el.scrollTop;
    pre.scrollLeft = el.scrollLeft;

    if (lineNumbers) {
        lineNumbers.scrollTop = el.scrollTop;
    }

    const overlay = document.getElementById("error-overlay");
    if (overlay) {
        overlay.scrollTop = el.scrollTop;
        overlay.scrollLeft = el.scrollLeft;
    }
}

function updateErrorOverlay(text) {
    const overlay = document.getElementById("error-overlay");
    if (!overlay) return;

    const lines = text.split("\n").length;
    overlay.innerHTML = Array(lines).fill(0).map((_, i) => {
        const lineNum = i + 1;
        const colNum = currentErrorLines.get(lineNum);

        if (colNum !== undefined) {
            // Sublinhado vermelho a partir da coluna
            // Usamos ch units que são compatíveis com fontes monoespaçadas
            // Sublinhamos 1 caractere ou usamos o til (~)
            const indent = colNum >= 1 ? colNum - 1 : 0;
            return `<div class="error-line-bg"><span style="margin-left: ${indent}ch; text-decoration: underline wavy #ef4444; font-weight: bold; color: #ef4444;">^</span></div>`;
        }

        return `<div>&nbsp;</div>`;
    }).join('');

    // Sincroniza scroll imediato se necessário
    const textArea = document.getElementById("codigo");
    if (textArea) overlay.scrollTop = textArea.scrollTop;
}

function updateCursorPosition(textarea) {
    const cursorEl = document.getElementById("cursor-position");
    if (!cursorEl || !textarea) return;

    const val = textarea.value;
    const sel = textarea.selectionStart;

    // Calcula linha e coluna
    const line = val.substring(0, sel).split("\n").length;
    const col = sel - val.lastIndexOf("\n", sel - 1);

    cursorEl.textContent = `Ln ${line}, Col ${col}`;
}

// Inicializa Highlighting
window.onload = () => {
    const textArea = document.getElementById("codigo");
    if (textArea) {
        updateHighlight(textArea.value);

        // Listeners para atualizar posição do cursor
        ['keyup', 'click', 'input'].forEach(evt => {
            textArea.addEventListener(evt, () => updateCursorPosition(textArea));
        });
    }

    // Configura o botão de executar
    const btnCompilar = document.getElementById("compilar");
    const btnAbrir = document.getElementById("abrir-arquivo");
    const btnSalvar = document.getElementById("salvar-arquivo");
    const btnSalvarComo = document.getElementById("salvar-como");
    const saidaDiv = document.getElementById("saida");

    let currentFilePath = null; // Estado do arquivo atual

    if (btnAbrir) {
        btnAbrir.addEventListener("click", async () => {
            if (window.api && window.api.openFile) {
                // Ao abrir, não recebemos o path do backend no metodo atual (apenas content), 
                // ideal seria retornar { content, filePath }. 
                // P.S: O backend retorna só content no momento. 
                // CORREÇÃO RÁPIDA: Vamos alterar o backend depois ou assumir null por enquanto?
                // MELHOR: Vamos alterar o renderer para lidar com o que temos ou o usuário pede.
                // Como não alterei o retorno do OpenFile no backend pra trazer o path,
                // vou assumir que "Abrir" por enquanto só lê o conteúdo.
                // *Nota Mental*: Idealmente o `dialog:openFile` deveria retornar obj, não string.

                // Vamos tentar salvar "Como" se não soubermos o path.
                const result = await window.api.openFile();

                if (result && result.content !== undefined) {
                    textArea.value = result.content;
                    updateHighlight(result.content);
                    currentFilePath = result.filePath; // Path recuperado do backend
                    document.title = `Pamdu-Ali | ${currentFilePath}`; // Atualiza título da janela
                }
            }
        });
    }

    const handleSave = async (asNew) => {
        if (window.api && window.api.saveFile) {
            const content = textArea.value;
            const pathInfo = await window.api.saveFile(content, asNew ? null : currentFilePath);
            if (pathInfo) {
                currentFilePath = pathInfo;
                // Feedback visual simples
                alert(`Arquivo salvo com sucesso!\n${pathInfo}`); // Simples alert para feedback imediato
            }
        }
    };

    if (btnSalvar) {
        btnSalvar.addEventListener("click", () => handleSave(false));
    }

    if (btnSalvarComo) {
        btnSalvarComo.addEventListener("click", () => handleSave(true));
    }

    if (btnCompilar) {
        btnCompilar.addEventListener("click", async () => {
            const codigo = textArea.value;
            saidaDiv.innerHTML = '<div class="log-info">Compilando...</div>';

            if (window.api && window.api.compile) {
                const resultado = await window.api.compile(codigo);
                saidaDiv.innerHTML = ""; // Limpa anterior

                // Função auxiliar para limpar ANSI codes
                const processText = (text) => {
                    // Remove códigos ANSI (ex: \u001b[31m)
                    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, "");
                    // Escapa HTML para segurança
                    return cleanText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                };

                // Renderiza ERROS
                if (resultado.errors && resultado.errors.length > 0) {
                    currentErrorLines.clear();

                    resultado.errors.forEach(err => {
                        // Limpa códigos ANSI para processamento lógico
                        const cleanErr = err.replace(/\x1b\[[0-9;]*m/g, "");

                        const div = document.createElement("div");
                        div.className = "log-entry log-error";
                        // Exibe usando processText que já faz escape de HTML
                        div.innerHTML = `<strong>⛔ ERRO:</strong>\n${processText(err)}`;
                        saidaDiv.appendChild(div);

                        // Tenta extrair número da linha e coluna da string limpa
                        const matchLine = cleanErr.match(/Linha:\s*(\d+)/i);
                        const matchCol = cleanErr.match(/Coluna:\s*(\d+)/i);

                        if (matchLine && matchLine[1]) {
                            const lineNum = parseInt(matchLine[1]);
                            const colNum = matchCol && matchCol[1] ? parseInt(matchCol[1]) : 1;
                            currentErrorLines.set(lineNum, colNum);
                        }
                    });

                    // Força re-renderização
                    updateLineNumbers(codigo);
                    updateErrorOverlay(codigo);
                }

                // Renderiza SAÍDA
                if (resultado.output && resultado.output.length > 0) {
                    // Cabeçalho de saída
                    const header = document.createElement("div");
                    header.className = "log-header";
                    header.innerText = "RESULTADO:";
                    saidaDiv.appendChild(header);

                    resultado.output.forEach(line => {
                        const div = document.createElement("div");
                        div.className = "log-entry log-success";
                        div.textContent = `> ${line}`;
                        saidaDiv.appendChild(div);
                    });
                }

                if ((!resultado.errors || resultado.errors.length === 0) && (!resultado.output || resultado.output.length === 0)) {
                    saidaDiv.innerHTML += '<div class="log-info">✅ Executado sem saída visual.</div>';
                }
                const webPreview = document.getElementById("web-preview");
                if (webPreview) {
                    if (resultado.html) {
                        webPreview.innerHTML = resultado.html;
                    } else {
                        webPreview.innerHTML = '<!-- Sem saída web -->';
                    }
                }

            } else {
                saidaDiv.textContent = "Erro: API não disponível.";
            }
        });
    }


    // --- Lógica de Gestão de Layout ---

    const container = document.querySelector(".editor-container");
    const layoutToggle = document.getElementById("layout-toggle");
    const toggleConsole = document.getElementById("toggle-console");
    const toggleWeb = document.getElementById("toggle-web");

    const terminalPanel = document.querySelector(".output-panel");
    const webPanel = document.querySelector(".web-panel");

    if (container) {
        container.classList.add("layout-horizontal"); // Default
    }

    if (toggleConsole) toggleConsole.classList.add("active");
    if (toggleWeb) toggleWeb.classList.add("active");

    if (layoutToggle) {
        layoutToggle.addEventListener("click", () => {
            const isHorizontal = container.classList.contains("layout-horizontal");
            if (isHorizontal) {
                container.classList.remove("layout-horizontal");
                container.classList.add("layout-vertical");
                layoutToggle.classList.add("active");
                layoutToggle.title = "Mudar para Layout Horizontal";
            } else {
                container.classList.remove("layout-vertical");
                container.classList.add("layout-horizontal");
                layoutToggle.classList.remove("active");
                layoutToggle.title = "Mudar para Layout Vertical";
            }
        });
    }

    const setupPanelToggle = (btn, panel, titleShow, titleHide) => {
        if (!btn || !panel) return;
        btn.addEventListener("click", () => {
            const isHidden = panel.classList.contains("hidden");
            if (isHidden) {
                panel.classList.remove("hidden");
                btn.classList.add("active");
                btn.title = titleHide;
            } else {
                panel.classList.add("hidden");
                btn.classList.remove("active");
                btn.title = titleShow;
            }
        });
    };

    setupPanelToggle(toggleConsole, terminalPanel, "Mostrar Console", "Ocultar Console");
    setupPanelToggle(toggleWeb, webPanel, "Mostrar Visualização Web", "Ocultar Visualização Web");

    // --- Lógica de Exportação ---
    const btnExportar = document.getElementById("exportar-web");
    if (btnExportar) {
        btnExportar.addEventListener("click", async () => {
            const webPreview = document.getElementById("web-preview");
            if (webPreview && window.api && window.api.exportWebsite) {
                const html = webPreview.innerHTML;
                if (!html || html.includes("<!-- Sem saída web -->")) {
                    alert("Não há nada para exportar! Execute o código primeiro.");
                    return;
                }
                const result = await window.api.exportWebsite(html);
                if (result) {
                    alert(`Website exportado com sucesso para:\n${result}`);
                }
            }
        });
    }


    // --- Lógica de Input no Console (Terminal-like) ---


    if (window.api && window.api.onInputRequest) {
        window.api.onInputRequest((promptMsg) => {
            promptMsg = promptMsg || "";

            // Cria container para a linha de input
            const inputLine = document.createElement("div");
            inputLine.className = "terminal-input-container";

            // Prompt (ex: "Digite seu nome: ")
            const promptSpan = document.createElement("span");
            promptSpan.className = "terminal-prompt";
            promptSpan.textContent = promptMsg.trim() ? `${promptMsg}` : "? ";

            // Campo de Input
            const inputEl = document.createElement("input");
            inputEl.type = "text";
            inputEl.className = "terminal-input";
            inputEl.autocomplete = "off";

            inputLine.appendChild(promptSpan);
            inputLine.appendChild(inputEl);
            saidaDiv.appendChild(inputLine);

            // Scroll para o final e foca
            saidaDiv.scrollTop = saidaDiv.scrollHeight;
            inputEl.focus();

            // Resolve input ao dar Enter
            const handleEnter = (e) => {
                if (e.key === "Enter") {
                    const value = inputEl.value;

                    // Remove o campo editável e deixa o texto estático (simula terminal)
                    inputEl.removeEventListener("keydown", handleEnter);
                    inputEl.disabled = true;

                    if (window.api && window.api.sendInput) {
                        window.api.sendInput(value);
                    }
                }
            };

            inputEl.addEventListener("keydown", handleEnter);
        });
    }

    // --- Atalhos de Teclado ---
    document.addEventListener("keydown", (e) => {
        // Ctrl + S: Salvar
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (e.shiftKey) {
                // Ctrl + Shift + S: Salvar Como
                if (btnSalvarComo) btnSalvarComo.click();
            } else {
                // Ctrl + S: Salvar
                if (btnSalvar) btnSalvar.click();
            }
        }

        // Ctrl + O: Abrir
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            if (btnAbrir) btnAbrir.click();
        }

        // F5: Compilar/Executar
        // (Nota: F5 geralmente recarrega a página em browsers, prevenimos isso aqui)
        if (e.key === 'F5') {
            e.preventDefault();
            if (btnCompilar) btnCompilar.click();
        }
    });
};
