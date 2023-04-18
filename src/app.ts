import logger from "./logger.js";
import path from "path";
import * as readline from "readline";
import { SocketServer } from "./sio_server.js";
import { spawn } from "node:child_process";
import { dirname } from "./util.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '-> '
});

const server = new SocketServer();

await server.start();
logger.info('Starting camera task');
const camera_task = spawn('python', [
    path.join(dirname(), 'python', 'camera_task.py'),
    '-f', '12'
], {
    stdio: 'pipe'
});
camera_task.stdout.on('data', data => {
    logger.info(`[camera-task] ${data}`);
});

const commands: any = {
    'ping': () => logger.info('[console] pong'),
    'quit': () => {
        logger.info('[console] shutting down...');
        camera_task.stdin.write('\r\n');
        camera_task.stdin.end();
        server.httpServer.close();
        rl.close();
        process.exit(0);
    }
}

rl.on('line', (input) => {
    let [cmd, ...args] = input.split(' ');
    if (commands[cmd]) {
        commands[cmd](...args);
    } else if (input != '') {
        console.log('unknown command');
    }
    rl.prompt();
});

rl.prompt();
