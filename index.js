require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexão com o Token do Render
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error("❌ ERRO: Adicione o TELEGRAM_TOKEN no painel do Render!");
    process.exit(1);
}
const bot = new TelegramBot(token, { polling: true });

// Inicialização do Banco de Dados
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id_telegram INTEGER PRIMARY KEY,
        nome TEXT,
        saldo REAL DEFAULT 0.0
    )
`);

// Lista interna de frases gratuitas para o comando de buscar
const frasesDeCria = [
    "Progresso pros nossos, porque pra atrasar já tem muita gente. Visão! 💸🎭",
    "Quem tem foco no objetivo não perde tempo olhando pro lado. Fé em Deus. 🙏🚩",
    "Humildade não é ser menos que ninguém, é saber que somos todos iguais. No topo ou na lama. 🚶‍♂️💨",
    "A inveja dorme leve, por isso minha rotina é no silêncio e o progresso é barulhento. 🤫🥇",
    "Muitos querem ver o fim do filme, mas poucos ajudaram a comprar o ingresso. Pouco papo. 🎬❌",
    "Dinheiro no bolso é bom, mas lealdade na mesa vale muito mais. Caráter vem de berço. 🤝👑"
];

function gerenciarUsuario(id, nome, callback) {
    db.get("SELECT * FROM usuarios WHERE id_telegram = ?", [id], (err, row) => {
        if (row) return callback(row);
        db.run("INSERT INTO usuarios (id_telegram, nome, saldo) VALUES (?, ?, 0.0)", [id, nome], () => {
            callback({ id_telegram: id, nome: nome, saldo: 0.0 });
        });
    });
}

// 📱 MENU PRINCIPAL (/start)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    gerenciarUsuario(msg.from.id, msg.from.first_name, (user) => {
        const texto = `🎭 *LOJA FRASES DE CRIA* 🎭\n\n👋 Salve, *${user.nome}*!\nAqui você encontra as melhores visões de progresso, status e bios exclusivas.\n\n🆔 *Seu ID:* \`${user.id_telegram}\`\n💰 *Saldo:* R$ ${user.saldo.toFixed(2).replace('.', ',')}\n\nEscolha uma opção no menu:`;
        
        bot.sendMessage(chatId, texto, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎲 Gerar Frase Aleatória", callback_data: "buscar_frase" }],
                    [{ text: "🛒 Comprar Pack Premium (Visões)", callback_data: "menu_comprar" }],
                    [{ text: "📞 Falar com Suporte", callback_data: "menu_suporte" }]
                ]
            },
            parse_mode: 'Markdown'
        });
    });
});

// 📊 INTERAÇÃO DOS BOTÕES
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;

    // --- FUNÇÃO 1: GERAR FRASE ALEATÓRIA ---
    if (data === 'buscar_frase') {
        const fraseAleatoria = frasesDeCria[Math.floor(Math.random() * frasesDeCria.length)];
        const txtFrase = `🚩 *VISÃO DE HOJE:* \n\n_"${fraseAleatoria}"_\n\n📱 _Use no seu status ou bio!_`;
        
        bot.editMessageText(txtFrase, {
            chat_id: chatId, message_id: msg.message_id,
            reply_markup: { 
                inline_keyboard: [
                    [{ text: "🔄 Gerar Outra", callback_data: "buscar_frase" }],
                    [{ text: "« Voltar", callback_data: "voltar_main" }]
                ] 
            },
            parse_mode: 'Markdown'
        });
    }

    // --- FUNÇÃO 2: COMPRAR PACK ---
    if (data === 'menu_comprar') {
        db.get("SELECT saldo FROM usuarios WHERE id_telegram = ?", [userId], (err, row) => {
            const saldo = row ? row.saldo : 0.0;
            const txtComprar = `🛒 *LOJA DE PACKS* 💸\n\n📦 *Pack Cria VIP (Mais de 500 Frases + 50 Bios do IG)*\n💵 *Preço:* R$ 10,00\n\n💰 *Seu Saldo Atual:* R$ ${saldo.toFixed(2).replace('.', ',')}\n\n⚠️ Você não possui saldo suficiente.\nPara depositar via PIX e liberar o pack, acione o suporte abaixo.`;
            
            bot.editMessageText(txtComprar, {
                chat_id: chatId, message_id: msg.message_id,
                reply_markup: { inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_main" }]] },
                parse_mode: 'Markdown'
            });
        });
    }

    // --- FUNÇÃO 3: SUPORTE ---
    if (data === 'menu_suporte') {
        const txtSuporte = "📞 *SUPORTE OFICIAL*\n\nPrecisa colocar saldo para comprar packs ou tirar dúvidas?\n\n👤 *Atendimento direto:* @SeuUsuarioDoSuporte\n\nMande o comprovante para o suporte liberar seu saldo na hora!";
        bot.editMessageText(txtSuporte, {
            chat_id: chatId, message_id: msg.message_id,
            reply_markup: { inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_main" }]] },
            parse_mode: 'Markdown'
        });
    }

    // AÇÃO VOLTAR
    if (data === 'voltar_main') {
        db.get("SELECT * FROM usuarios WHERE id_telegram = ?", [userId], (err, user) => {
            const texto = `🎭 *LOJA FRASES DE CRIA* 🎭\n\n👋 Salve, *${user.nome}*!\nAqui você encontra as melhores visões de progresso, status e bios exclusivas.\n\n🆔 *Seu ID:* \`${user.id_telegram}\`\n💰 *Saldo:* R$ ${user.saldo.toFixed(2).replace('.', ',')}\n\nEscolha uma opção no menu:`;
            bot.editMessageText(texto, {
                chat_id: chatId, message_id: msg.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🎲 Gerar Frase Aleatória", callback_data: "buscar_frase" }],
                        [{ text: "🛒 Comprar Pack Premium (Visões)", callback_data: "menu_comprar" }],
                        [{ text: "📞 Falar com Suporte", callback_data: "menu_suporte" }]
                    ]
                ],
                parse_mode: 'Markdown'
            });
        });
    }

    bot.answerCallbackQuery(callbackQuery.id);
});

// COMANDO EXCLUSIVO DE ADMIN PARA ADICIONAR SALDO: Exemplo no chat: /addsaldo 15
bot.onText(/\/addsaldo (.+)/, (msg, match) => {
    const quantia = parseFloat(match[1]);
    db.run("UPDATE usuarios SET saldo = saldo + ? WHERE id_telegram = ?", [quantia, msg.from.id], () => {
        bot.sendMessage(msg.chat.id, `💰 R$ ${quantia.toFixed(2)} adicionados com sucesso para testes!`);
    });
});

console.log("🤖 Bot Frases de Cria rodando com sucesso!");

