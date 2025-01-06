import { DurableObject } from 'cloudflare:workers'

// Messages coming from the client
type RawUserMessage = {
    text: string;
    name: string;
    connectionEstablished?: boolean;
}

// Parsed messages so the server can process them
type FormattedUserMessage = {
    text: string;
    type: string;
    name?: string;
}

export class Chat extends DurableObject {
    constructor(state: DurableObjectState, env: any) {
        super(state, env)
    }

   // Open a WebSocket connection with the client
   // Whenever a new user connects, acceptWebSocket is called to create a new WebSocketPair
   // and then that connection is effectively stored in the Durable Object state.
   async fetch(request: Request) {
    let [client, server] = Object.values(new WebSocketPair())
    this.ctx.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
   }

   // Called whenever the client sends a message (and the server must then recieve and process it)
   async webSocketMessage(ws: WebSocket, message: string) {
    const userMessage = this.formatUserMessage(message)
    this.broadcastMessage(userMessage)
   }

   // Triggered whenever the client disconnects (e.g. closes the browser)
   async webSocketClose(ws: WebSocket) {
    ws.close()
   }

   // Called whenever a message needs to be sent to all connected clients
   broadcastMessage(userMessage: FormattedUserMessage) {
    const websockets = this.ctx.getWebSockets()
    for (const ws of websockets) {
        ws.send(JSON.stringify(userMessage))
    }
   }

   // When a WS message is received, it is parsed using formatUserMessage into a FormattedUserMessage,
   // then handled here. This can either be a system message (e.g. welcome) or a user message (e.g. text)
   formatUserMessage(websocketMessage: string): FormattedUserMessage {
    const data = JSON.parse(websocketMessage) as RawUserMessage
    let userMessage;

    if (data.connectionEstablished) {
        userMessage = {
            text: `Welcome ${data.name}!`,
            type: 'system',
        }
    } else {
        userMessage = {
            text: data.text,
            type: 'user',
            name: data.name,
        }
    }
    return userMessage
   }
}