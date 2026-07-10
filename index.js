require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// --- CONFIGURAÇÃO DO BANCO DE DADOS (SQLite) ---
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Erro ao conectar ao banco de dados:', err.message);
    else console.log('📁 Banco de dados SQLite conectado com sucesso!');
});

// Cria a tabela de usuários se ela não existir
db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id_telegram INTEGER PRIMARY KEY,
        nome TEXT,
        saldo REAL DEFAULT 0.0
    )
`);

// --- CONFIGURAÇÃO DO BOT ---
const token = process.env.TELEGRAM_TOKEN || '8883919914:AAH331NrKZ3fpX5neb5RbyO4iWsXw5phkEc';
const bot = new TelegramBot(token, { polling: true });

// --- FUNÇÕES AUXILIARES DO BANCO ---
// Função para buscar ou registrar um usuário
function obterOuCriarUsuario(id_telegram, nome, callback) {
    db.get("SELECT * FROM usuarios WHERE id_telegram = ?", [id_telegram], (err, row) => {
        if (err) return callback(err);

        if (row) {
            // Usuário já existe, retorna os dados dele
            callback(null, row);
        } else {
            // Usuário novo, registra com saldo 0.0
            db.run("INSERT INTO usuarios (id_telegram, nome, saldo) VALUES (?, ?, ?)", [id_telegram, nome, 0.0], function(err) {
                if (err) return callback(err);
                callback(null, { id_telegram, nome, saldo: 0.0 });
            });
        }
    });
}

// --- COMANDOS E INTERAÇÕES ---

// 1. MENU PRINCIPAL (Disparado com /start)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || "Usuário";
    const userId = msg.from.id;

    // Busca o saldo real do usuário no banco de dados
    obterOuCriarUsuario(userId, firstName, (err, usuario) => {
        if (err) {
            return bot.sendMessage(chatId, "⚠️ Erro ao carregar seu perfil.");
        }

        const textoMenu = `
👋 Olá, *${usuario.nome}*! Bem-vindo à nossa loja.

👤 *Seu Perfil:*
🆔 *ID Único:* \`${usuario.id_telegram}\`
💰 *Saldo:* R$ ${usuario.saldo.toFixed(2).replace('.', ',')}

Escolha uma das opções abaixo para navegar:
        `;

        const opcoesMenu = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔍 Abrir Painel de Consultas", callback_data: "abrir_consultas" }],
                    [
                        { text: "ℹ️ Regras da Casa", callback_data: "regras_casa" },
                        { text: "📞 Suporte", callback_data: "suporte_ajuda" }
                    ]
                ]
            ],
            parse_mode: 'Markdown'
        };

        bot.sendMessage(chatId, textoMenu, opcoesMenu);
    });
});

// 2. CAPTURA DOS CLIQUES NOS BOTÕES
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;

    // Ação: Abrir o Painel de Consultas
    if (data === 'abrir_consultas') {
        // Buscamos o saldo atualizado antes de exibir o painel
        db.get("SELECT saldo FROM usuarios WHERE id_telegram = ?", [userId], (err, row) => {
            const saldoAtual = row ? row.saldo : 0.0;

            const textoPainel = `
👤 *Nome:* c*f*t*t*l*r*a*t*n*o*v*s*s*u*a
🪪 *CPF:* ******-94

📊 *Score Serasa:*
CSB8: ****
CSBA: ****

💰 *Poder Aquisitivo:*
Nível: ******
Renda: R$ ******,**
Faixa: ***** até ******

💵 *Preço:* 18 (saldo)
💰 *Seu saldo:* R$ ${saldoAtual.toFixed(2).replace('.', ',')}
            `;

            const opcoesPainel = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔍 Buscar live", callback_data: "buscar_live" }],
                        [{ text: "🛒 Comprar está info Live", callback_data: `comprar_live_${userId}` }],
                        [{ text: "🛒 Comprar está info Virgem", callback_data: `comprar_virgem_${userId}` }],
                        [
                            { text: "<<", callback_data: "voltar_pag" },
                            { text: ">>", callback_data: "avancar_pag" }
                        ],
                        [
                            { text: "<< 50", callback_data: "voltar_50" },
                            { text: "50 >>", callback_data: "avancar_50" }
                        ],
                        [{ text: "« Voltar ao Menu Inicial", callback_data: "voltar_menu_principal" }]
                    ]
                ],
                parse_mode: 'Markdown'
            };

            bot.editMessageText(textoPainel, { chat_id: chatId, message_id: msg.message_id, ...opcoesPainel });
        });
    }

    // Ação: Tentar comprar Info Live
    if (data.startsWith('comprar_live_')) {
        db.get("SELECT saldo FROM usuarios WHERE id_telegram = ?", [userId], (err, row) => {
            const saldoAtual = row ? row.saldo : 0.0;
            const preco = 18.0;

            if (saldoAtual < preco) {
                bot.answerCallbackQuery(callbackQuery.id, { 
                    text: `❌ Saldo insuficiente! Você tem R$ ${saldoAtual.toFixed(2)}, mas a info custa R$ ${preco.toFixed(2)}.`, 
                    show_alert: true 
                });
            } else {
                // Aqui você descontaria o saldo e entregaria a info
                const novoSaldo = saldoAtual - preco;
                db.run("UPDATE usuarios SET saldo = ? WHERE id_telegram = ?", [novoSaldo, userId], () => {
                    bot.answerCallbackQuery(callbackQuery.id, { text: "✅ Compra realizada com sucesso!", show_alert: true });
                    // Adicione aqui a lógica de entrega da info
                });
            }
        });
        return;
    }

    // Ação: Mostrar Regras da Casa
    if (data === 'regras_casa') {
        const textoRegras = `
📜 *REGRAS DA CASA* 📜

1️⃣ *Sem Reembolso:* Uma vez adquirida a info, não há troca a menos que seja comprovado erro.
2️⃣ *Suporte:* Atendimento apenas para assuntos financeiros ou problemas na entrega.
3️⃣ *Respeito:* Ofensas ao suporte gerarão banimento imediato.
        `;

        const botaoVoltar = {
            reply_markup: { inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_menu_principal" }]] },
            parse_mode: 'Markdown'
        };

        bot.editMessageText(textoRegras, { chat_id: chatId, message_id: msg.message_id, ...botaoVoltar });
    }

    // Ação: Mostrar Suporte
    if (data === 'suporte_ajuda') {
        const textoSuporte = `
📞 *SUPORTE AO CLIENTE*

Precisa de ajuda com saldo, compras ou dúvidas?
👤 *Atendente:* @SeuUsuarioDoSuporte Aqui
        `;

        const botaoVoltar = {
            reply_markup: { inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_menu_principal" }]] },
            parse_mode: 'Markdown'
        };

        bot.editMessageText(textoSuporte, { chat_id: chatId, message_id: msg.message_id, ...botaoVoltar });
    }

    // Ação: Voltar para o Menu Principal
    if (data === 'voltar_menu_principal') {
        db.get("SELECT * FROM usuarios WHERE id_telegram = ?", [userId], (err, usuario) => {
            const textoMenu = `
👋 Olá, *${usuario.nome}*! Bem-vindo à nossa loja.

👤 *Seu Perfil:*
🆔 *ID Único:* \`${usuario.id_telegram}\`
💰 *Saldo:* R$ ${usuario.saldo.toFixed(2).replace('.', ',')}

Escolha uma das opções abaixo para navegar:
            `;

            const opcoesMenu = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔍 Abrir Painel de Consultas", callback_data: "abrir_consultas" }],
                        [
                            { text: "ℹ️ Regras da Casa", callback_data: "regras_casa" },
                            { text: "📞 Suporte", callback_data: "suporte_ajuda" }
                        ]
                    ]
                ],
                parse_mode: 'Markdown'
            };

            bot.editMessageText(textoMenu, { chat_id: chatId, message_id: msg.message_id, ...opcoesMenu });
        });
    }

    bot.answerCallbackQuery(callbackQuery.id);
});

console.log("🤖 Bot com Banco de Dados rodando!");

