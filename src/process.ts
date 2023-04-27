import { spawn, ChildProcess, StdioOptions } from 'node:child_process';
import EventEmitter from 'node:events';
import logger from './logger.js'

export class ProcessManager extends EventEmitter {
    command: string;
    args: string[];
    process ?: ChildProcess;
    stdioOptions: StdioOptions;
    running: boolean;

    constructor(command: string, args: string[]) {
        super()
        this.command = command;
        this.args = args;
        this.stdioOptions = ['pipe', 'pipe', 'inherit'];
        this.running = false;
    }

    start() {
        this.process = spawn(this.command, this.args, {
            stdio: this.stdioOptions
        });
        this.registerEvents();
        this.running = true;
    }

    respawnProcess() {
        if (this.running) {
            logger.error('Respawn request for python process while process is running');
            return;
        }
        logger.info('Respawning python process...');
        this.process = spawn(this.command, this.args, {
            stdio: this.stdioOptions
        });
        this.registerEvents();
        this.running = true;
        this.emit('process-restart');
    }

    registerEvents() {
        this.process?.on('exit', (code, signal) => {
            logger.error(`Python process exited with code ${code} (${signal})`);
            this.running = false;
            this.respawnProcess();
        });

        this.process?.stdout?.on('data', data => {
            logger.info(`[python] ${data}`);
        });
    }
}