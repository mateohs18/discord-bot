const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");
const fs = require('fs');
const path = require('path');

// --- Configuración de la ruta del archivo de contador de reseñas ---
// Esta ruta asume que 'reseñas.js' está en una subcarpeta (ej. 'slashcommands/Moderacion/')
// y 'reviewsCount.json' está en la raíz del proyecto.
// '__dirname' es la carpeta actual (Moderacion), '..' sube un nivel (a slashcommands),
// y el segundo '..' sube otro nivel (a la raíz del proyecto).
const REVIEWS_COUNT_FILE = path.join(__dirname, '..', '..', 'reviewsCount.json');
// Si tu archivo reseñas.js está directamente en la carpeta 'slashcommands', entonces sería:
// const REVIEWS_COUNT_FILE = path.join(__dirname, '..', 'reviewsCount.json');


// Función para leer el contador de reseñas
function getReviewsCount() {
    try {
        if (fs.existsSync(REVIEWS_COUNT_FILE)) {
            const data = fs.readFileSync(REVIEWS_COUNT_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            return parsedData.totalReviews || 0;
        }
    } catch (error) {
        console.error("Error al leer el contador de reseñas:", error);
    }
    return 0;
}

// Función para actualizar el contador de reseñas
function updateReviewsCount(newCount) {
    try {
        fs.writeFileSync(REVIEWS_COUNT_FILE, JSON.stringify({ totalReviews: newCount }, null, 2));
    } catch (error) {
        console.error("Error al actualizar el contador de reseñas:", error);
    }
}

module.exports = {
    CMD: new SlashCommandBuilder()
        .setName("reseña")
        .setDescription("Envía una reseña para el bot.")
        .addStringOption(option => // OPCIÓN 1: Comentario (TEXTO LIBRE) - Obligatorio
            option.setName("comentario")
                  .setDescription("Escribe tu comentario o reseña para el bot.")
                  .setRequired(true)
        )
        .addIntegerOption(option => // OPCIÓN 2: Estrellas (SELECTOR NUMÉRICO) - Obligatorio
            option.setName("estrellas")
                  .setDescription("Selecciona la cantidad de estrellas para tu reseña.")
                  .setRequired(true)
                  .addChoices(
                      { name: '1 Estrella ⭐', value: 1 },
                      { name: '2 Estrellas ⭐⭐', value: 2 },
                      { name: '3 Estrellas ⭐⭐⭐', value: 3 },
                      { name: '4 Estrellas ⭐⭐⭐⭐', value: 4 },
                      { name: '5 Estrellas ⭐⭐⭐⭐⭐', value: 5 }
                  )
        )
        .addAttachmentOption(option => // OPCIÓN 3: Imagen (ADJUNTO) - Opcional
            option.setName("imagen")
                  .setDescription("Adjunta una imagen relacionada con la reseña.")
                  .setRequired(false)
        ),

    async execute(client, interaction) {
        // Obtener los valores de las opciones del comando
        const estrellas = interaction.options.getInteger("estrellas");
        const comentario = interaction.options.getString("comentario");
        const imagen = interaction.options.getAttachment("imagen");

        // --- CONFIGURA ESTE ID CON EL ID REAL DE TU CANAL DE RESEÑAS EN DISCORD ---
        const CANAL_DE_RESEÑAS_ID = "805328311625842735"; // Ejemplo: "1234567890123456789"
        const canalDestino = client.channels.cache.get(CANAL_DE_RESEÑAS_ID);

        // Verificar si el canal de destino es válido y de tipo texto
        if (!canalDestino || canalDestino.type !== ChannelType.GuildText) {
            console.error(`Canal de reseñas no encontrado o no es un canal de texto válido: ${CANAL_DE_RESEÑAS_ID}`);
            return interaction.reply({
                content: "Error: No se pudo encontrar el canal de reseñas configurado o no es un canal de texto válido. Por favor, contacta a un administrador del bot.",
                flags: 1 << 6 // ephemeral
            });
        }

        // Lógica para el contador de reseñas
        let currentCount = getReviewsCount();
        currentCount++; // Incrementa el contador
        updateReviewsCount(currentCount); // Guarda el nuevo contador

        // Genera la cadena de estrellas visuales (ej. "⭐⭐⭐⭐⭐")
        const estrellasVisuales = '⭐'.repeat(estrellas);

        // Obtener la fecha actual en un formato legible
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Obtener la hora actual en un formato legible
        const horaActual = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Formato de 24 horas
        });


        // Crea el Embed que se enviará al canal de reseñas
        const reviewEmbed = new EmbedBuilder()
            .setTitle("✨ ¡Nueva Reseña! ✨")
            .setDescription(`${estrellasVisuales}\n\n**Reseña:** ${comentario}`) // Mostrar estrellas y comentario
            .addFields(
                { name: "Reseña N°:", value: `${currentCount}`, inline: true }, // Número de reseña
                { name: "Reseñado por:", value: `${interaction.user}`, inline: true }, // Usuario que reseñó
                { name: "Reseñado el:", value: `${fechaActual} ${horaActual}`, inline: false } // Fecha y hora
            )
            .setColor("#ffcc00") // Color similar al amarillo/dorado de la imagen
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })) // Avatar del usuario como thumbnail
            // .setFooter({ // No se usa footer en el ejemplo de la imagen para el autor, pero puedes volver a añadirlo si quieres
            //     text: `Reseña de ${interaction.user.tag}`,
            //     iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            // })
            .setTimestamp(); // Añade la marca de tiempo (la fecha y hora exacta de Discord, más precisa)

        // Si se adjuntó una imagen, añádela al embed
        if (imagen) {
            reviewEmbed.setImage(imagen.url); // Establece la URL de la imagen como imagen principal del embed
        }

        // Intenta enviar el embed al canal de reseñas
        try {
            await canalDestino.send({ embeds: [reviewEmbed] });
            // Responde al usuario que envió el comando
            await interaction.reply({
                content: "✅ Tu reseña ha sido enviada correctamente. ¡Muchas gracias!",
                flags: 1 << 6 // Respuesta efímera (solo visible para el usuario)
            });
        } catch (error) {
            console.error("Error al enviar la reseña:", error);
            // Si ocurre un error al enviar, informa al usuario
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: '❌ Hubo un error al intentar enviar tu reseña. Por favor, inténtalo de nuevo más tarde.',
                    flags: 1 << 6
                });
            } else {
                await interaction.reply({
                    content: '❌ Hubo un error al intentar enviar tu reseña. Por favor, inténtalo de nuevo más tarde.',
                    flags: 1 << 6
                });
            }
        }
    }
};