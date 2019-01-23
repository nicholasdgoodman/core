import * as http from 'http';
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';
import { ClientConnection } from './base';
import { WebSocketClient } from './socket_client';

import * as log from '../log';
import idPool from '../int_pool';
import route from '../../common/route';

class WebSocketServer extends EventEmitter {
    private hasStarted: boolean;
    private activeConnections: { [id: string]: WebSocketClient };
    private httpServer: http.Server;
    private httpServerError: boolean;

    constructor() {
        super();

        this.hasStarted = false;
        this.activeConnections = {};
        this.httpServer = http.createServer((req, res) => {
            res.writeHead(403, {
                'Content-Type': 'text/plain'
            });
            res.end('');
        });
        this.httpServerError = false;

        this.httpServer.on('error', (err) => {
            this.httpServerError = true;
            this.emit(route.server('error'), err);
        });
    }

    public getPort(): number {
        const serverAddress = <AddressInfo>this.httpServer.address();

        return (serverAddress && serverAddress.port) || null;
    }

    public closeAllConnections() {
        const usedIds = Object.keys(this.activeConnections);
        usedIds.forEach((id) => {
            if (this.activeConnections[id]) {
                this.activeConnections[id].close();
            }
        });
    }

    public start(port: number) {
        if (this.hasStarted && !this.httpServerError) {
            log.writeToLog(1, 'socket server already running', true);
            return;
        }

        this.httpServer.listen(port, '127.0.0.1', () => {
            if (this.httpServerError) {
                this.httpServerError = false;
                return;
            }

            const wss = new WebSocket.Server({
                server: this.httpServer
            });

            wss.on('headers', (headers) => {
                this.emit(route.server('headers'), headers);
            });

            wss.on('error', (err) => {
                this.httpServerError = true;
                this.emit(route.server('error'), err);
            });

            wss.on('connection', (ws: WebSocket) => {
                const id = idPool.next();
                const client = new WebSocketClient(ws, id);

                this.activeConnections[id] = client;

                client.on(route.connection('close'), (id) => {
                    delete this.activeConnections[id];
                    this.emit(route.server('close'), id);
                });

                this.emit(route.server('connection'), id);
            });

            this.emit(route.server('open'), this.getPort());
        });

        this.hasStarted = true;
    }

    //TODO: this map should live in corestate somehow
    public getClientById(id: number): ClientConnection {
        //TODO: put the no-ops or safety logic elsewhere
        //      missing all the eventlistener stuff
        return this.activeConnections[id] || <any>{
            send: () => { /* do nothing */ },
            close: () => { /* do nothing */ },
            isOpen: () => false
        };
    }
}

export default new WebSocketServer();
