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
    },
    parse_mode: 'Markdown'
};
