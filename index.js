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

// Função para registrar/buscar cliente
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
        const texto = `👋 Olá, *${user.nome}*!\n\n🆔 *Seu ID:* \`${user.id_telegram}\`\n💰 *Saldo:* R$ ${user.saldo.toFixed(2).replace('.', ',')}\n\nEscolha uma opção no menu abaixo:`;
        
        bot.sendMessage(chatId, texto, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💳 Buscar BIN", callback_data: "menu_bin" }],
                    [{ text: "🛒 Comprar", callback_data: "menu_comprar" }],
                    [{ text: "📞 Suporte", callback_data: "menu_suporte" }]
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

    // --- FUNÇÃO 1: BUSCAR BIN ---
    if (data === 'menu_bin') {
        const txtBin = "🔍 *BUSCA DE BIN*\n\nPara buscar as informações de uma BIN, basta digitar o comando:\n`/bin 450799`\n\n_(Substitua os números pela BIN que deseja consultar)_";
        bot.editMessageText(txtBin, {
            chat_id: chatId, message_id: msg.message_id,
            reply_markup: { inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_main" }]] },
            parse_mode: 'Markdown'
        });
    }

    // --- FUNÇÃO 2: COMPRAR ---
    if (data === 'menu_comprar') {
        db.get("SELECT saldo FROM usuarios WHERE id_telegram = ?", [userId], (err, row) => {
            const saldo = row ? row.saldo : 0.0;
            const txtComprar = `🛒 *PAINEL DE VENDAS*\n\n💰 *Seu Saldo:* R$ ${saldo.toFixed(2)}\n\n⚠️ Você não possui saldo suficiente para comprar.\nPara adicionar saldo, entre em contato com o suporte técnico.`;
            
            bot.editMessageText(txtComprar, {
                chat_id: chatId, message_id: msg.message_id,
                reply_markup: { inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_main" }]] },
                parse_mode: 'Markdown'
            });
        });
    }

    // --- FUNÇÃO 3: SUPORTE ---
    if (data === 'menu_suporte') {
        const txtSuporte = "📞 *SUPORTE AO CLIENTE*\n\nPrecisa de ajuda com saldo, dúvidas ou reportar problemas?\n\n👤 *Atendimento Oficial:* @SeuUsuarioDoSuporte\n⏰ *Horário:* Todos os dias";
        bot.editMessageText(txtSuporte, {
            chat_id: chatId, message_id: msg.message_id,
            reply_markup: { inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_main" }]] },
            parse_mode: 'Markdown'
        });
    }

    // AÇÃO VOLTAR
    if (data === 'voltar_main') {
        db.get("SELECT * FROM usuarios WHERE id_telegram = ?", [userId], (err, user) => {
            const texto = `👋 Olá, *${user.nome}*!\n\n🆔 *Seu ID:* \`${user.id_telegram}\`\n💰 *Saldo:* R$ ${user.saldo.toFixed(2).replace('.', ',')}\n\nEscolha uma opção no menu abaixo:`;
            bot.editMessageText(texto, {
                chat_id: chatId, message_id: msg.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "💳 Buscar BIN", callback_data: "menu_bin" }],
                        [{ text: "🛒 Comprar", callback_data: "menu_comprar" }],
                        [{ text: "📞 Suporte", callback_data: "menu_suporte" }]
                    ]
                ],
                parse_mode: 'Markdown'
            });
        });
    }

    bot.answerCallbackQuery(callbackQuery.id);
});

// ⚡ LÓGICA DO COMANDO /bin (Simulando uma resposta de consulta)
bot.onText(/\/bin (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const binDigitada = match[1].trim();

    if (binDigitada.length < 6) {
        return bot.sendMessage(chatId, "❌ Digite pelo menos os 6 primeiros dígitos da BIN.");
    }

    // Exemplo de resposta simulada. No futuro você pode conectar isso a uma API de BIN externa
    const resultadoBin = `
💳 *RESULTADO DA BIN:* \`${binDigitada.substring(0, 6)}\`

🔹 *Bandeira:* VISA
🔹 *Tipo:* CREDIT
🔹 *Nível:* CLASSIC
🔹 *Banco:* BANCO DO BRASIL S.A.
🔹 *País:* Brasil 🇧🇷
    `;

    bot.sendMessage(chatId, resultadoBin, { parse_mode: 'Markdown' });
});

// COMANDO PARA ADMIN ADICIONAR SALDO DE TESTE: Ex: /addsaldo 50
bot.onText(/\/addsaldo (.+)/, (msg, match) => {
    const quantia = parseFloat(match[1]);
    db.run("UPDATE usuarios SET saldo = saldo + ? WHERE id_telegram = ?", [quantia, msg.from.id], () => {
        bot.sendMessage(msg.chat.id, `💰 R$ ${quantia} adicionados para testes!`);
    });
});

console.log("🤖 Bot focado em Vendas/BIN inicializado!");
