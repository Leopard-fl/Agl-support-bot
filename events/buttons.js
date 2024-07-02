const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { eventshandler, db, webhookClient } = require("..");
const config = require("../config");
const { time } = require("../functions");

module.exports = new eventshandler.event({
    event: 'interactionCreate',
    run: async (client, interaction) => {

        if (!interaction.isButton()) return;

        switch (interaction.customId) {
            case 'close': {
                const guild = client.guilds.cache.get(config.modmail.guildId);
                const category = guild.channels.cache.find((v) => v.id === config.modmail.categoryId || v.name === 'ModMail');

                if (interaction.channel.parentId !== category.id) return;

                await interaction.reply({
                    content: 'Please wait...',
                    ephemeral: true
                });

                const transcriptMessages = [];

                const messages = await interaction.channel.messages.fetch();

                for (const message of messages.values()) {
                    if (message.embeds && message.author.id === client.user.id) {
                        transcriptMessages.push(`[${new Date(message.createdTimestamp).toLocaleString()}] ${message.embeds[0]?.author?.name}: ${(message.embeds[0]?.description || message.embeds[0]?.image?.proxyURL || '[Error: Unable to fetch message content]')} ${message.attachments?.size > 0 ? message.attachments.map((v) => v.proxyURL).join(' ') : ''}`);
                    } else if ((message.content || message.attachments?.size) && message.author.bot === false) {
                        transcriptMessages.push(`[${new Date(message.createdTimestamp).toLocaleString()}] ${message.author.displayName}: ${message.content} ${message.attachments?.size > 0 ? message.attachments.map((v) => v.proxyURL).join(' ') : ''}`);
                    } else continue;
                };

                transcriptMessages.reverse();
                
                // This will remove the first messages when the mail is created, do not touch this to avoid future errors.
                transcriptMessages.shift();
                transcriptMessages.shift();

                const data = (await db.select('mails', { channelId: interaction.channelId }))[0];

                await interaction.channel.delete();

                const user = client.users.cache.get(data?.authorId);

                if (!user) return;

                await user.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Your Ticket has been closed.')
                            .setDescription(`Thank you for contacting Air Greenland Roblox support team!, If you have any further questions, please feel free to open a new ticket.`)

.setColor('#c40040')       

.setImage('https://media.discordapp.net/attachments/1256190857640411237/1256219287761195102/173_20240628190646.png?ex=66849621&is=668344a1&hm=653305dfefff6ac34a5dfb5d257389f48f65a0d321bcbff4569178c0b0a3b49c&')                        
                            .setFooter({
                                text: `Air Greenland Roblox Support Team`
                            })
                    ]
                }).catch(null);

                if (!webhookClient) break;

                await webhookClient.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Mail closed')
                            .setDescription(`<@${data?.authorId || '000000000000000000'}>'s mail has been closed by a staff.\n\n**Executed by**: ${interaction.user.displayName} (${interaction.user.toString()})\n**Date**: ${time(Date.now(), 'f')} (${time(Date.now(), 'R')})`)
                            .setFooter({ text: interaction.guild.name + '\'s  logging system' })
                            .setColor('#c40040')
                    ]
                });

                break;
            };
        };

    }
});