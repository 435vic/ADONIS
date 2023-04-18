import { pino } from 'pino';

const logger = pino({
    level: 'debug',
    transport: {
        targets: [
            {
                level: 'debug',
                target: 'pino-pretty',
                crlf: false,
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    translateTime: 'yyyy-mm-dd HH:MM:ss'
                }
            }
        ]
    }
});

export { logger as default };