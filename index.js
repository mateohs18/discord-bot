// Estas líneas suelen ir al principio de index.js
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // Asegúrate de tener este intent si tu bot lee mensajes
    // Añade cualquier otro intent que necesites
] });
client.slashCommands = new Collection(); // Colección para almacenar los comandos de barra

require("dotenv").config(); // Para cargar el token desde .env

// Importar el slashHandler
const { loadSlash } = require("./handlers/slashHandler"); // Asegúrate de que la ruta sea correcta y el archivo exista

// Evento Ready del bot
client.on("ready", async () => {
    console.log(`Bot encendido como: ${client.user.tag}`);

    // Cargar comandos de barra
    try {
        await loadSlash(client); // Llama a la función loadSlash para cargar los comandos
        console.log("Comandos de barra cargados exitosamente.");
    } catch (error) {
        console.error("Error al cargar comandos de barra:", error);
    }
});

// Evento InteractionCreate (cuando un usuario usa un comando de barra)
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return; // Solo procesa interacciones de comando de barra

    const command = client.slashCommands.get(interaction.commandName);

    if (!command) {
        return interaction.reply({ content: "Este comando no existe o no se pudo cargar.", ephemeral: true });
    }

    const args = [];
    for (const option of interaction.options.data) {
        if (option.type === 1) { // Esto es un SUB_COMMAND
            if (option.options) {
                option.options.forEach((x) => args.push(x.value));
            }
        } else if (option.value !== undefined) {
            args.push(option.value);
        }
    }

    try {
        await command.execute(client, interaction, args); // Ejecuta el comando
    } catch (error) {
        console.error("Error al ejecutar el comando:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Hubo un error al ejecutar este comando.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Hubo un error al ejecutar este comando.', ephemeral: true });
        }
    }
});

// Iniciar sesión en Discord
client.login(process.env.TOKEN)
    .catch((err) => {
        console.error("Error al iniciar sesión en Discord:", err);
        process.exit(1); // Sale de la aplicación si el login falla
    });