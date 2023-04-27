import logger from "./logger.js";
import path from "path";
import * as readline from "readline";
import { ProcessManager } from "./process.js";
import { SocketServer } from "./sio_server.js";
import { dirname, filename } from "./util.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '-> '
});

function runCommand(input: string) {
    let [cmd, ...args] = input.split(' ');
    if (commands[cmd]) {
        commands[cmd](...args);
    } else if (input != '') {
        console.log('unknown command');
    }
}

const server = new SocketServer(runCommand);

await server.start();
logger.info('Starting camera task');
const camera_task = new ProcessManager('python', [
    path.join(dirname(), 'python', 'hw_manager.py'),
    '-f', '12'
])
camera_task.on('process-restart', () => {
    server.sio.emit('process-restarted');
}); 
camera_task.start();

const commands: any = {
    'ping': () => logger.info('[console] pong'),
    'python-restart': () => {
        logger.info('[console] restarting python process...');
        if (!camera_task.running) {
            logger.info('[console] process is not running. starting...');
            camera_task.start();
            return;
        }
        camera_task.process?.stdin?.write('\r\n');
        camera_task.process?.stdin?.end();
        logger.info('[console] process killed');
    },
    'python-kill': () => {
        logger.info('[console] killing python process...');
        if (!camera_task.process?.kill()) {
            logger.error('[console] there was an error killing the python process');
            return;
        }
        logger.info('[console] process killed');
    },
    'quit': () => {
        logger.info('[console] shutting down...');
        camera_task.process?.stdin?.write('\r\n');
        camera_task.process?.stdin?.end();
        server.sio.disconnectSockets(true);
        server.sio.close();
        server.httpServer.close();
        rl.close();
        process.exit(0);
    }
}

rl.on('line', (input) => {
    runCommand(input);
    rl.prompt();
});

rl.prompt();
