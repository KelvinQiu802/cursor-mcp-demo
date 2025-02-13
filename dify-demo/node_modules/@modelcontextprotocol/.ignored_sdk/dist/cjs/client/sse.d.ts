import { type ErrorEvent, type EventSourceInit } from "eventsource";
import { Transport } from "../shared/transport.js";
import { JSONRPCMessage } from "../types.js";
export declare class SseError extends Error {
    readonly code: number | undefined;
    readonly event: ErrorEvent;
    constructor(code: number | undefined, message: string | undefined, event: ErrorEvent);
}
/**
 * Client transport for SSE: this will connect to a server using Server-Sent Events for receiving
 * messages and make separate POST requests for sending messages.
 */
export declare class SSEClientTransport implements Transport {
    private _eventSource?;
    private _endpoint?;
    private _abortController?;
    private _url;
    private _eventSourceInit?;
    private _requestInit?;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;
    constructor(url: URL, opts?: {
        eventSourceInit?: EventSourceInit;
        requestInit?: RequestInit;
    });
    start(): Promise<void>;
    close(): Promise<void>;
    send(message: JSONRPCMessage): Promise<void>;
}
//# sourceMappingURL=sse.d.ts.map