import http from "http";
import path from "path";
import express from "express";
import logger from "./logger.js";
import * as io from "socket.io";
import { dirname, MovementManager, Direction, ControllerData } from "./util.js";

// MJPEG stream
// https://www.phind.com/search?cache=1708aa2a-dee9-48b2-87cb-61323a0672ee&init=true

export class SocketServer {
    httpServer: http.Server;
    sio: io.Server;
    app: express.Express;
    port: number;
    nspcam: io.Namespace;
    nspserial: io.Namespace;
    botMovement: MovementManager;
    ccc?: (input: string) => void;
    camsocket?: io.Socket;
    previousSerialCommands ?: string[];


    constructor(consoleCommandCallback ?: (input: string) => void, port = 8085, httpServer?: http.Server) {
        this.port = port;
        this.app = express();
        this.app.use('/', express.static(path.join(dirname(), 'static')))
        this.httpServer = httpServer ?? http.createServer(this.app);
        this.sio = new io.Server(this.httpServer);
        this.botMovement = new MovementManager(100, 80, 35);
        this.ccc = consoleCommandCallback;

        this.sio.on('connection', socket => {
            logger.debug(`Client connection from ${socket.id}`);
            this.registerEvents(socket);
        });

        this.nspcam = this.sio.of('/camera');
        this.nspcam.on('connection', (socket) => {
            logger.debug(`Camera socket connection from ${socket.id}`)
            this.camsocket?.emit('disconnect-replaced');
            this.camsocket?.disconnect(true);
            this.camsocket = socket;
        });
        
        this.nspserial = this.sio.of('/serial');
        this.nspserial.on('connection', (socket) => {
            logger.debug(`Serial socket connection from ${socket.id}`);
            socket.on('serial-rx', data => {
                logger.trace(`serial: ${data}`);
            });
        });
        

        this.app.get('/stream', (req, res, next) => {
            if (!this.camsocket?.connected) {
                res.status(503).send('Internal Server Error');
                next();
                return;
            }

            res.writeHead(200, {
                'Age': 0,
                'Cache-Control': 'no-cache, private',
                'Pragma': 'no-cache',
                'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
            });

            const callback = (data: Buffer, annotations?: any) => {
                this.sio.emit('frame-meta', annotations);
                res.write('--frame\r\n');
                res.write('Content-Type: image/jpeg\r\n');
                res.write(`Content-Length: ${data.length}\r\n\r\n`);
                res.write(data);
                res.write('\r\n');
            };

            this.camsocket?.on('frame', callback);
            res.on('close', () => {
                logger.debug('Client stream closed');
                this.camsocket?.off('frame', callback);
                res.end();
            });
            next();
        });
    }

    registerEvents(socket: io.Socket) {
        socket.on('ping', (callback) => {
            logger.debug(`Ping from client`);
            if (callback) {
                callback('pong');
            }
        });

        socket.on('control', (id: string, data?: any) => {
            const dir = id.split('-')[2]
            this.botMovement.processMovementEvent(dir as Direction, data.type == 'mouseup');

            const command = this.botMovement.getCommand();
            logger.debug(`${dir}: ${command}`);
            this.nspserial.emit('serial-tx', command);
        });

        socket.on('controller', (data: ControllerData) => {
            const commands = this.botMovement.processController(data);
            for (let i = 0; i < commands.length; i++) {
                if (this.previousSerialCommands && this.previousSerialCommands[i] == commands[i]) continue;
                this.nspserial.emit('serial-tx', commands[i]);
            }
            this.previousSerialCommands = commands;
        });

        socket.on('serial-tx', (command) => {
            this.nspserial.emit('serial-tx', command);
        });

        if (this.ccc != null) {

            socket.on('console-command', (input: string) => {
                if (!this.ccc) return;
                logger.warn(`Running console command from client: ${input}`);
                this.ccc(input);
            });
        }
    }

    async start() {
        await new Promise((resolve) => {
            this.httpServer.listen(this.port, () => {
                logger.info(`Started server; listening on port ${this.port}`);
                resolve(this.httpServer);
            });
        });
    }
}
