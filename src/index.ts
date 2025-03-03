import dotenv from 'dotenv';
import { client } from './client';
import { handleEvents } from './handlers/eventHandler';
import { handleCommands } from './handlers/commandHandler';
import { logInfo } from './utils/logger';

dotenv.config();

handleEvents(client);
handleCommands(client);

client.login(process.env.DISCORD_TOKEN).then(() => {
  logInfo('Bot logged in successfully!');
}); 