import Lexer from "./lexer/Lexer";
import Parser from "./parser/Parser";
import SemanticAnalyzer from "./semantic/Semantic";
import { TacGenerator } from "./códigointemerdiario/gerador";
import { TacOptimizer } from "./códigointemerdiario/optimizar";
import fs from "fs";
import path from "path";


const filePath = path.join(__dirname, "input", "code.nt");
const code = fs.readFileSync(filePath, "utf-8");

const lexer = new Lexer(code);
const parser = new Parser(lexer);
const ast = parser.parse();

const semantic = new SemanticAnalyzer();
semantic.execute(ast);

const generator = new TacGenerator;
const TacOriginal = generator.generate(ast);

console.log('TAC Antes da optimização');
console.log('tacOriginal');

const optimizar = new TacOptimizer();
const Tacoptimized = optimizar.optimize(TacOriginal);

console.log ('TAC Depois da Optimização:');
console.log (Tacoptimized);