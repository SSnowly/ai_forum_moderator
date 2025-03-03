import { Client, Collection, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { logInfo, logError, logSuccess } from '../utils/logger';

export interface Command {
    data: SlashCommandBuilder;
    execute: (...args: any[]) => Promise<void>;
}

export const commands = new Collection<string, Command>();

export async function handleCommands(client: Client) {
    const commandsPath = join(__dirname, '../commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            commands.set(command.data.name, command);
            logInfo(`Loaded command: ${command.data.name}`);
        }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    try {
        logInfo('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
            { body: commands.map(command => command.data.toJSON()) }
        );

        logSuccess('Successfully reloaded application (/) commands.');
    } catch (error) {
        logError(`Error refreshing commands: ${error}`);
    }
} 