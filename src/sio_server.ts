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
        this.nspcam = this.sio.of('/camera');
        this.nspcam.on('connection', (socket) => {
            logger.debug(`Camera socket connection from ${socket.id}`)
            this.camsocket?.emit('disconnect-replaced');
            this.camsocket?.disconnect(true);
            this.registerCamEvents(socket)
            this.camsocket = socket;
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

            this.camsocket?.on('frame', (data: Buffer, annotations?: any) => {
                res.write('--frame\r\n');
                res.write('Content-Type: image/jpeg\r\n');
                res.write(`Content-Length: ${data.length}\r\n\r\n`);
                res.write(data);
                res.write('\r\n');
            });
    
            next();
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

    registerCamEvents(socket: io.Socket) {
    }
}