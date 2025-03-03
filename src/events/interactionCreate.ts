import { Events, Interaction, EmbedBuilder } from 'discord.js';
import { commands } from '../handlers/commandHandler';
import { logError, logInfo } from '../utils/logger';

async function handleModAction(interaction: Interaction, action: 'approve' | 'deny') {
    if (!interaction.isButton()) return;
    
    try {
        const member = await interaction.guild?.members.fetch(interaction.user.id);
        if (!member?.roles.cache.has(process.env.DISCORD_MODERATOR_ROLE_ID!)) {
            await interaction.reply({
                content: '❌ You do not have permission to moderate posts.',
                ephemeral: true
            });
            return;
        }

        const threadId = interaction.customId.split('_').pop();
        if (!threadId) {
            await interaction.reply({
                content: '❌ Could not find thread information.',
                ephemeral: true
            });
            return;
        }

        const thread = await interaction.guild?.channels.fetch(threadId);
        if (!thread?.isThread()) {
            await interaction.reply({
                content: '❌ Could not find the thread.',
                ephemeral: true
            });
            return;
        }

        if (action === 'approve') {
            await thread.setLocked(false);

            const messages = await thread.messages.fetch({ limit: 1 });
            const firstMessage = messages.first();
            if (firstMessage) {
                const approvedEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Post Approved')
                    .setDescription(`Your post has been approved by ${interaction.user.tag}. Good luck with your project!`)
                    .setTimestamp();

                await firstMessage.edit({ embeds: [approvedEmbed] });
            }

            const approvedModEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Post Approved')
                .setDescription(`Post has been approved by ${interaction.user.tag}`)
                .addFields(
                    { name: 'Thread', value: thread.name, inline: true }
                )
                .setTimestamp();

            await interaction.update({
                embeds: [approvedModEmbed],
                components: []
            });

            logInfo(`Thread ${thread.name} was manually approved by ${interaction.user.tag}`);
        } else {
            
            const threadName = thread.name;
            const authorId = thread.ownerId;

            
            await thread.delete();

            
            const denyEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚫 Post Denied')
                .setDescription('Post has been denied and removed.')
                .addFields(
                    { name: 'Thread', value: threadName, inline: true },
                    { name: 'Author', value: `<@${authorId}>`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.update({
                embeds: [denyEmbed],
                components: []
            });

            logInfo(`Thread ${threadName} was denied by ${interaction.user.tag}`);
        }
    } catch (error) {
        logError(`Error handling ${action} action: ${error}`);
        await interaction.reply({
            content: `There was an error processing your request: ${error}`,
            ephemeral: true
        });
    }
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: Interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction);
            } else if (interaction.isButton()) {
                const action = interaction.customId.startsWith('approve_post') ? 'approve' : 'deny';
                await handleModAction(interaction, action);
            }
        } catch (error) {
            logError(`Error handling interaction: ${error}`);
            
            if (interaction.isRepliable() && !interaction.replied) {
                await interaction.reply({
                    content: 'There was an error while executing this interaction!',
                    ephemeral: true
                });
            }
        }
    },
}; 