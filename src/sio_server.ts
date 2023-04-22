import http from "http";
import path from "path";
import express from "express";
import logger from "./logger.js";
import * as io from "socket.io";
import { dirname, filename } from "./util.js";

// MJPEG stream
// https://www.phind.com/search?cache=1708aa2a-dee9-48b2-87cb-61323a0672ee&init=true

export class SocketServer {
    httpServer: http.Server;
    sio: io.Server;
    app: express.Express;
    port: number;
    nspcam: io.Namespace;
    camsocket?: io.Socket;

    constructor(port = 8085, httpServer?: http.Server) {
        this.port = port;
        this.app = express();
        this.app.use('/', express.static(path.join(dirname(), 'static')))
        this.httpServer = httpServer ?? http.createServer(this.app);
        this.sio = new io.Server(this.httpServer);

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
            callback('pong');
        });

        socket.on('control', (id: string, data?: any) => {
            logger.debug(`Control command ${id} ${JSON.stringify(data)}`)
            // Serial stuff: send command, etc
            if (id == 'control-move-up') {
                this.nspserial.emit('serial-tx', (data.type == 'mousedown') ? 'M,50,50' : 'M,0,0');
            } else if (id == 'control-move-down') {
                this.nspserial.emit('serial-tx', (data.type == 'mousedown') ? 'M,-50,-50' : 'M,0,0');
            }
        });
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
