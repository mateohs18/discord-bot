const { readdirSync } = require("fs");

module.exports = {
    async loadSlash(client) {
        const commandBaseDir = "./slashcommands";
        client.slashCommands.clear(); // Limpiar comandos existentes antes de cargar

        // Iterar sobre las categorías o archivos directamente en slashcommands
        for (const entry of readdirSync(commandBaseDir)) {
            const entryPath = `${commandBaseDir}/${entry}`;
            const stats = require('fs').statSync(entryPath);

            if (stats.isDirectory()) { // Si es una carpeta de categoría (ej: Moderacion)
                for (const fileName of readdirSync(entryPath).filter((file) => file.endsWith(".js"))) {
                    const command = require(`../slashcommands/${entry}/${fileName}`);
                    // Asegúrate de que el comando exporta 'CMD' y 'name'
                    if (command.CMD && command.CMD.name) { // Verifica que CMD y CMD.name existan
                        client.slashCommands.set(command.CMD.name, command);
                    } else {
                        console.warn(`[ADVERTENCIA] El archivo de comando ${entry}/${fileName} no tiene una propiedad CMD.name válida y será ignorado.`);
                    }
                }
            } else if (stats.isFile() && entry.endsWith(".js")) { // Si es un archivo .js directamente en slashcommands
                const command = require(`../slashcommands/${entry}`);
                if (command.CMD && command.CMD.name) { // Verifica que CMD y CMD.name existan
                    client.slashCommands.set(command.CMD.name, command);
                } else {
                    console.warn(`[ADVERTENCIA] El archivo de comando ${entry} no tiene una propiedad CMD.name válida y será ignorado.`);
                }
            }
        }

        // Mapear los comandos de la colección para enviarlos a Discord
        // Ahora, 'x' es el objeto 'command' completo, y necesitamos 'x.CMD.toJSON()'
        const commandsToRegister = client.slashCommands.map((commandObject) => commandObject.CMD.toJSON());

        // Registrar los comandos en Discord
        // Para pruebas, es mejor registrar en un servidor específico (Guild Commands).
        // const GUILD_ID = 'TU_ID_DEL_SERVIDOR'; // <-- ¡Reemplaza con tu ID de servidor!
        // const guild = client.guilds.cache.get(GUILD_ID);
        // if (guild) {
        //     await guild.commands.set(commandsToRegister);
        //     console.log(`Comandos de barra registrados en el servidor ${GUILD_ID}.`);
        // } else {
        //     console.warn(`No se pudo encontrar el servidor con ID ${GUILD_ID}. Registrando comandos globalmente.`);
        //     await client.application?.commands.set(commandsToRegister);
        // }

        // Si prefieres el registro global (tarda más en propagarse)
        await client.application?.commands.set(commandsToRegister);
        console.log("Comandos de barra registrados globalmente.");
    }
};