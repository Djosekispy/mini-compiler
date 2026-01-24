import Lexer from "./lexer/Lexer";
import Parser from "./parser/Parser";
import SemanticAnalyzer from "./semantic/Semantic";
import fs from "fs";
import path from "path";


const argumentPath = process.argv[2];
const defaultPath = path.join(__dirname, "input", "code.nt");

const filePath = argumentPath ? path.resolve(argumentPath) : defaultPath;

try {
    const code = fs.readFileSync(filePath, "utf-8");
    console.log(`\n📄 Processando arquivo: ${path.basename(filePath)}`);

    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const ast = parser.parse();

    const semantic = new SemanticAnalyzer();
    semantic.execute(ast);
    
    console.log("✅ Analise concluída com sucesso!");
} catch (err: any) {
    console.error(`\n❌ Erro no Compilador: ${err.message}`);
    process.exit(1); 
}