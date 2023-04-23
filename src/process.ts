import { spawn, ChildProcess, StdioOptions } from 'node:child_process'
import logger from './logger.js'

export class ProcessManager {
    command: string;
    args: string[];
    process: ChildProcess;
    stdioOptions: StdioOptions;
    running: boolean;

    constructor(command: string, args: string[]) {
        this.command = command;
        this.args = args;
        this.stdioOptions = ['pipe', 'pipe', 'inherit'];
        this.process = spawn(command, args, {
            stdio: this.stdioOptions
        });
        this.running = true;
        
        this.process.on('exit', (code, signal) => {
            logger.error(`Python process exited with code ${code} (${signal})`);
            this.running = false;
            this.respawnProcess();
        }); 

        this.process.stdout?.on('data', data => {
            logger.info(`[python] ${data}`);
        });
    }

    respawnProcess() {
        if (this.running) {
            logger.warn('Respawn request for python process while process is running');
            return;
        }
        logger.info('Respawning python process...');
        this.process = spawn(this.command, this.args, {
            stdio: this.stdioOptions
        });
        this.running = true;
    }
}