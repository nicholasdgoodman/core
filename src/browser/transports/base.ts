import { EventEmitter } from 'events';

class MyEmitter extends EventEmitter {
    constructor() {
        super();
    }
}

export interface ClientConnection extends EventEmitter {
    send(data: any): void;
    close(): void;
    isOpen(): void;
}

export abstract class BroadcastConnection {
    protected eventEmitter: MyEmitter;

    constructor() {
        this.eventEmitter = new MyEmitter();
    }

    public on(eventName: string, listener: (sender: any, data: string) => void): void {
        this.eventEmitter.on.call(this.eventEmitter, eventName, listener);
    }

    // not implemented in base
    public abstract publish(data: any): boolean;
}
