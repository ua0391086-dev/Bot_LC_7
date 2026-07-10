require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Substitua pelo Token que você pegou no @BotFather
const token = process.env.TELEGRAM_TOKEN || 'SEU_TOKEN_DO_TELEGRAM_AQUI';
const bot = new TelegramBot(token, { polling: true });

// 1. MENU PRINCIPAL (Disparado com /start)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || "Usuário";
    const userId = msg.from.id; // Esse é o ID único do usuário no Telegram

    const textoMenu = `
👋 Olá, *${firstName}*! Bem-vindo à nossa loja.

👤 *Seu Perfil:*
🆔 *ID Único:* \`${userId}\`
💰 *Saldo:* R$ 0,00

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
        },
        parse_mode: 'Markdown'
    };

    bot.sendMessage(chatId, textoMenu, opcoesMenu);
});

// 2. CAPTURA DOS CLIQUES NOS BOTÕES
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    // Ação: Abrir o Painel de Consultas (O menu da foto anterior)
    if (data === 'abrir_consultas') {
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
💰 *Seu saldo:* 6.20
        `;

        const opcoesPainel = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔍 Buscar live", callback_data: "buscar_live" }],
                    [{ text: "🛒 Comprar está info Live", callback_data: "comprar_live" }],
                    [{ text: "🛒 Comprar está info Virgem", callback_data: "comprar_virgem" }],
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

        // Edita a mensagem atual para mostrar o painel (evita poluir o chat com muitas mensagens)
        bot.editMessageText(textoPainel, { chat_id: chatId, message_id: msg.message_id, ...opcoesPainel });
    }

    // Ação: Mostrar Regras da Casa
    if (data === 'regras_casa') {
        const textoRegras = `
📜 *REGRAS DA CASA* 📜

1️⃣ *Sem Reembolso:* Uma vez adquirida a info, não há troca a menos que seja comprovado o erro na categoria "Virgem".
2️⃣ *Suporte:* O suporte atende apenas assuntos financeiros ou problemas na entrega.
3️⃣ *Respeito:* Ofensas ao suporte gerarão banimento imediato e perda do saldo.

_Fique atento às atualizações das regras!_
        `;

        const botaoVoltar = {
            reply_markup: {
                inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_menu_principal" }]]
            },
            parse_mode: 'Markdown'
        };

        bot.editMessageText(textoRegras, { chat_id: chatId, message_id: msg.message_id, ...botaoVoltar });
    }

    // Ação: Mostrar Suporte
    if (data === 'suporte_ajuda') {
        const textoSuporte = `
📞 *SUPORTE AO CLIENTE*

Precisa de ajuda com saldo, compras ou dúvidas?
Fale diretamente com o nosso atendimento oficial.

👤 *Atendente:* @SeuUsuarioDoSuporte Aqui
⏰ *Horário:* 09:00 às 22:00
        `;

        const botaoVoltar = {
            reply_markup: {
                inline_keyboard: [[{ text: "« Voltar", callback_data: "voltar_menu_principal" }]]
            },
            parse_mode: 'Markdown'
        };

        bot.editMessageText(textoSuporte, { chat_id: chatId, message_id: msg.message_id, ...botaoVoltar });
    }

    // Ação: Voltar para o Menu Principal de qualquer lugar
    if (data === 'voltar_menu_principal') {
        const firstName = callbackQuery.from.first_name || "Usuário";
        const userId = callbackQuery.from.id;

        const textoMenu = `
👋 Olá, *${firstName}*! Bem-vindo à nossa loja.

👤 *Seu Perfil:*
🆔 *ID Único:* \`${userId}\`
💰 *Saldo:* R$ 0,00

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
    }

    // Exemplo de placeholder para os outros botões
    if (data === 'comprar_live') {
        bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Saldo insuficiente!", show_alert: true });
        return;
    }

    // Confirma que o clique foi processado
    bot.answerCallbackQuery(callbackQuery.id);
});

console.log("🤖 Bot atualizado rodando! Digite /start no Telegram.");
