/**
 * GERADOR AUTOMÁTICO DE CASOS DE TESTE
 * Objetivo: Criar arquivos .txt com códigos válidos e inválidos para testar o compilador.
 */
const fs = require('fs');
const path = require('path');

// Configuração de caminhos (Usando caminhos absolutos para evitar erros no Windows)
const VALID_DIR = path.join(__dirname, 'test_cases', 'validos');
const INVALID_DIR = path.join(__dirname, 'test_cases', 'invalidos');

function gerarArquivo(diretorio, nome, conteudo) {
    const caminho = path.join(diretorio, `${nome}.txt`);
    try {
        fs.writeFileSync(caminho, conteudo);
        console.log(`[GERADOR] Criado: ${nome}.txt`);
    } catch (err) {
        console.error(`[ERRO] Falha ao criar ${nome}:`, err.message);
    }
}

console.log("Iniciando geração de massa de testes...");

// --- CATEGORIA: TESTES VÁLIDOS (Devem passar no compilador) ---
gerarArquivo(VALID_DIR, '01_declaracao_simples', 'let x = 10;');
gerarArquivo(VALID_DIR, '02_operacao_matematica', 'let y = 5 + 5;');
gerarArquivo(VALID_DIR, '03_declaracao_simples', 'let z = 50;');
// --- CATEGORIA: TESTES INVÁLIDOS (Devem gerar erro no compilador) ---
gerarArquivo(INVALID_DIR, '01_erro_sintaxe_ponto_virgula', 'let x = 10'); // Sem ponto e vírgula
gerarArquivo(INVALID_DIR, '02_erro_atribuicao_vazia', 'let y = ;');        // Falta o valor
gerarArquivo(INVALID_DIR, '03_erro_parenteses', 'if true) { }');           // Falta um parêntese

console.log("Geração concluída com sucesso!");