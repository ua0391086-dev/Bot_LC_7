require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Criando a instância do bot com as permissões (Intents) básicas
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Evento disparado quando o bot liga com sucesso
client.once('ready', () => {
    console.log(`🤖 Bot online como ${client.user.tag}!`);
});

// Evento de escuta de mensagens (Exemplo de comando simples)
client.on('messageCreate', (message) => {
    // Evita que o bot responda a si mesmo ou a outros bots
    if (message.author.bot) return;

    // Comando simples "!ping"
    if (message.content === '!ping') {
        message.reply('🏓 Pong!');
    }
});

// Logando o bot usando o token do arquivo .env
client.login(process.env.DISCORD_TOKEN);

