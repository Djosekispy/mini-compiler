/**
 * EXECUTOR AUTOMATIZADO DE TESTES
 * Objetivo: Rodar o compilador contra os arquivos gerados e validar o comportamento.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Usamos o caminho absoluto para o ts-node e para o index.ts
const COMPILER_CMD = `npx ts-node "${path.join(__dirname, 'src', 'index.ts')}"`;

const VALID_DIR = path.join(__dirname, 'test_cases', 'validos');
const INVALID_DIR = path.join(__dirname, 'test_cases', 'invalidos');

function executarTestes(diretorio, devePassar) {
    if (!fs.existsSync(diretorio)) return { total: 0, acertos: 0 };

    const arquivos = fs.readdirSync(diretorio).filter(f => f.endsWith('.txt'));
    let acertos = 0;

    console.log(`\n--- 📂 Categoria: ${devePassar ? 'VÁLIDOS' : 'INVÁLIDOS'} ---`);

    arquivos.forEach(arquivo => {
        // 2. O path.resolve cria o caminho completo e sem erros
        const caminhoArquivo = path.resolve(diretorio, arquivo);
        
        try {
            // 3. Colocamos aspas duplas envolta do "${caminhoArquivo}" para proteger o espaço no nome do usuário
            execSync(`${COMPILER_CMD} "${caminhoArquivo}"`, { stdio: 'pipe' });
            
            if (devePassar) {
                console.log(`   ✅ [SUCESSO] ${arquivo}`);
                acertos++;
            } else {
                console.log(`   ❌ [FALHA] ${arquivo}: Devia ter falhado`);
            }
        } catch (error) {
            if (!devePassar) {
                console.log(`   ✅ [SUCESSO] ${arquivo}: Erro detectado corretamente`);
                acertos++;
            } else {
                console.log(`   ❌ [FALHA] ${arquivo}: O compilador rejeitou um código válido.`);
                // Mostra o erro real se algo der errado:
                const erroReal = error.stderr ? error.stderr.toString() : error.message;
                console.log(`      👉 Erro: ${erroReal.split('\n')[0]}`);
            }
        }
    });

    return { total: arquivos.length, acertos };
}

console.log("🔍 Iniciando Validação...");
const v = executarTestes(VALID_DIR, true);
const i = executarTestes(INVALID_DIR, false);

console.log(`\n========================================`);
console.log(`📊 RELATÓRIO FINAL: ${v.acertos + i.acertos}/${v.total + i.total} OK`);
console.log(`========================================`);