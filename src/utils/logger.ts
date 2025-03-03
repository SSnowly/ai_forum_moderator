import chalk from 'chalk';

const timestamp = () => `[${new Date().toLocaleTimeString()}]`;

const logLevel = process.env.LOG_LEVEL || 'info';
const logLevelNumber = logLevel === 'debug' ? 3 : logLevel === 'info' ? 2 : logLevel === 'warn' ? 1 : 0;

export const logInfo = (message: string) => {
    if (logLevelNumber >= 2) {
        console.log(`${chalk.blue(timestamp())} ${chalk.white(message)}`);
    }
};

export const logSuccess = (message: string) => {
    if (logLevelNumber >= 2) {
        console.log(`${chalk.blue(timestamp())} ${chalk.green(message)}`);
    }
};

export const logWarn = (message: string) => {
    if (logLevelNumber >= 1) {
        console.log(`${chalk.blue(timestamp())} ${chalk.yellow(message)}`);
    }
};

export const logError = (message: string) => {
    if (logLevelNumber >= 0) {
        console.log(`${chalk.blue(timestamp())} ${chalk.red(message)}`);
    }
};

export const logDebug = (message: string) => {
    if (logLevelNumber >= 3) {
        console.log(`${chalk.blue(timestamp())} ${chalk.magenta(message)}`);
    }
}; 