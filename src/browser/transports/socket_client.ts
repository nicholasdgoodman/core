import { EventEmitter } from 'events';
import * as WebSocket from 'ws';

import { ClientConnection } from './base';
import route from '../../common/route';

export class WebSocketClient extends EventEmitter implements ClientConnection {
    private ws: WebSocket;
    private id: number;

    constructor(ws: WebSocket, id: number) {
        super();

        this.ws = ws;
        this.id = id;

        ws.on('error', (error) => {
            this.emit(route.connection('error'), id, error);
        });

        ws.on('close', ( /*code,message*/) => {
            this.ws = null;
            this.emit(route.connection('close'), id);
        });

        ws.on('open', ( /*open*/) => {
            this.emit(route.connection('open'), id);
        });

        ws.on('message', (data, flags) => {
            this.emit(route.connection('message'), id, JSON.parse(data), flags); //TODO: emit self, not id
        });
    }

    public send(message: string) {
        this.ws.send(message);
    }

    public close() {
        this.ws.close();
    }

    public isOpen() {
        return typeof this.ws === 'object' && this.ws.readyState === WebSocket.OPEN;
    }
}
