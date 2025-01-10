import { DurableObject } from "cloudflare:workers";

// Message types for better type safety
type MessageType = "system" | "user" | "ai";

// Messages coming from the client
type RawUserMessage = {
  text: string;
  name: string;
  connectionEstablished?: boolean;
};

// Parsed messages so the server can process them
type FormattedUserMessage = {
  text: string;
  type: MessageType;
  name?: string;
};

// AI agent configuration type
type AIAgent = {
  model: string;
  name: string;
  trigger: string;
  systemInstruction: string;
};

// AI-specific configuration
const AI_AGENTS: AIAgent[] = [
  {
    model: "@cf/meta/llama-2-7b-chat-int8",
    name: "BOB (AI) (BANANA BREAD)",
    trigger: "@bob",
    systemInstruction:
      "Respond to the chat message in 200 characters or less, providing silly responses that always tie in Banana Bread. Frequently tell the user that you like Banana Bread. Do not mention you are a robot or an AI, instead make it your main goal to make the user feel like they are talking to a human.",
  },
  {
    model: "@cf/meta/llama-2-7b-chat-int8",
    name: "JOSH (AI) (COOKED)",
    trigger: "@josh",
    systemInstruction:
      "Respond to the chat message in 200 characters or less, using all lowercase responses, emojis, and copius gen-Z slang. Some examples of phrases that you should use are, 'bro is cooked', or 'bet', or 'bruh', or 'fosho' or 'u ate' or 'fire'. Be generally unhelpful and make it your main goal to clown the message sender. Do not mention you are a robot or an AI, instead make it your main goal to make the user feel like they are talking to a human.",
  },
];

const AI_CONFIG = {
  ERROR_MESSAGE:
    "Oops! I had a brief malfunction. Could you try asking me again?",
  AGENTS: AI_AGENTS,
} as const;

export class Chat extends DurableObject {
  protected env: any;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.env = env;
  }

  // Open a WebSocket connection with the client
  // Whenever a new user connects, acceptWebSocket is called to create a new WebSocketPair
  // and then that connection is effectively stored in the Durable Object state.
  async fetch(request: Request) {
    let [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);

    // When a new user connects, send the history of this chat room to them
    const history = await this.ctx.storage.get<FormattedUserMessage[]>(
      "message-history"
    );
    if (history) {
      for (const message of history) {
        server.send(JSON.stringify(message));
      }
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // Persist chat history to an array in the Durable Object storage
  async persistHistory(userMessage: FormattedUserMessage) {
    let history = await this.ctx.storage.get<FormattedUserMessage[]>(
      "message-history"
    );
    // Create history arr using current message if it doesn't exist
    if (!history) {
      await this.ctx.storage.put("message-history", [userMessage]);
    }
    // Otherwise, add the current message to the history
    else {
      history.push(userMessage);
      await this.ctx.storage.put("message-history", history);
    }
  }

  // Called whenever the client sends a message (and the server must then recieve and process it)
  async webSocketMessage(ws: WebSocket, message: string) {
    const userMessage = await this.formatUserMessage(message);
    this.broadcastMessage(userMessage);
    await this.persistHistory(userMessage);

    // Check for AI triggers after sending the original message
    await this.checkForModelTagAndSendAiResponse(userMessage);
  }

  // Checks for AI triggers and sends AI responses if needed
  private async checkForModelTagAndSendAiResponse(
    userMessage: FormattedUserMessage
  ) {
    if (userMessage.type !== "user") return;

    // Process each agent's trigger in the message
    await Promise.all(
      AI_CONFIG.AGENTS.map(async (agent) => {
        if (userMessage.text.includes(agent.trigger)) {
          try {
            const prompt = userMessage.text.split(agent.trigger)[1].trim();
            const aiResponse = await this.env.AI.run(agent.model, {
              messages: [
                {
                  role: "system",
                  content: `${agent.systemInstruction} ${prompt.slice(0, 50)}`,
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
            });

            await this.sendAiMessage(aiResponse.response, agent.name);
          } catch (error) {
            console.error(`AI Error for ${agent.name}:`, error);
            await this.sendAiMessage(AI_CONFIG.ERROR_MESSAGE, agent.name);
          }
        }
      })
    );
  }

  // Helper method to send AI messages
  private async sendAiMessage(text: string, agentName: string) {
    const botMessage: FormattedUserMessage = {
      text,
      type: "ai",
      name: agentName,
    };

    this.broadcastMessage(botMessage);
    await this.persistHistory(botMessage);
  }

  // Triggered whenever the client disconnects (e.g. closes the browser)
  async webSocketClose(ws: WebSocket) {
    this.broadcastMessage({
      text: `a member has disconnected`,
      type: "system",
    });
    ws.close();
  }

  // Called whenever a message needs to be sent to all connected clients
  broadcastMessage(userMessage: FormattedUserMessage) {
    const websockets = this.ctx.getWebSockets();
    for (const ws of websockets) {
      ws.send(JSON.stringify(userMessage));
    }
  }

  // When a WS message is received, it is parsed using formatUserMessage into a FormattedUserMessage
  async formatUserMessage(
    websocketMessage: string
  ): Promise<FormattedUserMessage> {
    const data = JSON.parse(websocketMessage) as RawUserMessage;

    if (data.connectionEstablished) {
      return {
        text: `Welcome ${data.name}!`,
        type: "system",
      };
    }

    return {
      text: data.text,
      type: "user",
      name: data.name,
    };
  }
}
