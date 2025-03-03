import { Client, Events } from 'discord.js';
import { logSuccess } from '../utils/logger';

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        logSuccess(`Ready! Logged in as ${client.user?.tag}`);
    },
}; 