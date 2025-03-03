import { Events, ThreadChannel, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, TextChannel, PermissionFlagsBits } from 'discord.js';
import { validateForumPost } from '../utils/gemini';
import { logInfo, logError } from '../utils/logger';

async function handleScamPost(thread: ThreadChannel, authorId: string) {
    try {
        
        const guild = thread.guild;
        const member = await guild.members.fetch(authorId);
        
        
        try {
            await member.timeout(24 * 60 * 60 * 1000, 'Posting scam content');
        } catch (error) {
            logError(`Error timing out member: ${error}`);
        }
        
        
        await thread.delete();
        
        
        const logChannel = guild.channels.cache.get(process.env.DISCORD_SCAM_LOG_CHANNEL_ID!) as TextChannel;
        if (logChannel) {
            const scamEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚫 Scam Post Detected')
                .setDescription(`A scam post was detected and removed.`)
                .addFields(
                    { name: 'User', value: `<@${authorId}> (${member.user.tag})`, inline: true },
                    { name: 'Thread Name', value: thread.name, inline: true },
                    { name: 'Action Taken', value: 'Thread deleted and user timed out for 24 hours', inline: false }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [scamEmbed] });
        }
    } catch (error) {
        logError(`Error handling scam post: ${error}`);
    }
}

module.exports = {
    name: Events.ThreadCreate,
    once: false,
    async execute(thread: ThreadChannel) {
        
        if (thread.parentId !== process.env.DISCORD_FORUM_CATEGORY_ID) return;

        try {
            
            await thread.setLocked(true, 'Post pending review');
            await thread.setArchived(false);

            
            const checkingEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔍 Checking Post')
                .setDescription('Your post is being reviewed for compliance with our forum rules...')
                .setTimestamp();

            const message = await thread.send({ embeds: [checkingEmbed] });

            
            const starterMessage = await thread.fetchStarterMessage();
            if (!starterMessage) {
                throw new Error('Could not fetch starter message');
            }

            
            const validation = await validateForumPost(starterMessage.content);

            if (validation.valid) {
                
                await thread.setLocked(false);
                const approvedEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Post Approved')
                    .setDescription('Your post has been automatically approved. Good luck with your project!')
                    .setTimestamp();

                await message.edit({ embeds: [approvedEmbed] });
                logInfo(`Thread ${thread.name} was automatically approved`);
            } else if (validation.reason === "This post is a scam. Please do not post it.") {
                
                await handleScamPost(thread, starterMessage.author.id);
            } else {
                
                const approveButton = new ButtonBuilder()
                    .setCustomId(`approve_post_${thread.id}`)
                    .setLabel('Approve Post')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(false);

                const denyButton = new ButtonBuilder()
                    .setCustomId(`deny_post_${thread.id}`)
                    .setLabel('Deny Post')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(false);

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(approveButton, denyButton);

                
                const reviewEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⚠️ Manual Review Required')
                    .setDescription(`This post requires manual review.\nReason: ${validation.reason}`)
                    .addFields(
                        { name: 'Note', value: 'This post is locked until approved by a moderator.' }
                    )
                    .setTimestamp();

                
                await message.edit({ embeds: [reviewEmbed] });

                
                const modChannel = thread.guild.channels.cache.get(process.env.DISCORD_SCAM_LOG_CHANNEL_ID!) as TextChannel;
                if (modChannel) {
                    const modEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🔍 Post Needs Review')
                        .setDescription(`A new post requires manual review.\n\n**Thread:** [${thread.name}](${message.url})\n**Author:** ${starterMessage.author.tag}`)
                        .addFields(
                            { name: 'Reason for Review', value: validation.reason },
                            { name: 'Post Content', value: starterMessage.content.length > 1024 ? 
                                starterMessage.content.slice(0, 1021) + '...' : 
                                starterMessage.content }
                        )
                        .setTimestamp();

                    await modChannel.send({
                        content: `<@&${process.env.DISCORD_MODERATOR_ROLE_ID}>`,
                        embeds: [modEmbed],
                        components: [row]
                    });
                }

                logInfo(`Thread ${thread.name} requires manual review: ${validation.reason}`);
            }
        } catch (error) {
            logError(`Error processing thread ${thread.name}: ${error}`);
        }
    },
}; 