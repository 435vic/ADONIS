import path from "path";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { filename, dirname } from "./util.js"

const app = express()
const server = http.createServer(app)
const sio = new Server(server)


app.use('/', express.static(path.join(dirname(), 'static')))

app.listen(8085, () => {
    console.log('App is running lol');
});
