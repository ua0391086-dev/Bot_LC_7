const { Bot } = require("grammy");

// Substitua pelo TOKEN que você pegou no @BotFather do Telegram
const BOT_TOKEN = "8883919914:AAH331NrKZ3fpX5neb5RbyO4iWsXw5phkEc"; 

const bot = new Bot(BOT_TOKEN);

// Banco de dados temporário de frases (você pode expandir isso depois)
const frases = [
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "A sua única limitação é aquela que você impõe na sua própria mente.",
  "Não espere por oportunidades, crie-as.",
  "O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor momento é agora."
];

// Comando inicial (/start)
bot.command("start", (ctx) => {
  ctx.reply(
    "👋 Olá! Bem-vindo ao Bot de Frases.\n\n" +
    "Use o comando /frase para receber uma dose de inspiração instantânea!"
  );
});

// Comando para enviar a frase (/frase)
bot.command("frase", (ctx) => {
  // Sorteia uma frase da lista
  const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
  
  ctx.reply(`✨ *Sua frase do dia:* \n\n"${fraseAleatoria}"`, {
    parse_mode: "Markdown",
  });
});

// Mensagem padrão para qualquer outro texto
bot.on("message", (ctx) => {
  ctx.reply("Não entendi. Digite /frase para receber uma frase!");
});

// Inicia o bot
console.log("🚀 Bot online e rodando...");
bot.start();
