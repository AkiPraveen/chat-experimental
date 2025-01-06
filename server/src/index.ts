import { Hono } from "hono";
import { env } from "hono/adapter";
import { Chat } from "./chat";

export { Chat } from "./chat";

type Env = {
  CHATS: DurableObjectNamespace<Chat>;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Join chat by ID & create WebSocket connection
app.get("/api/chat/:id", (c) => {
  const chatId = c.req.param("id");

  const doId = c.env.CHATS.idFromName(chatId);
  const chat = c.env.CHATS.get(doId);

  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
    return c.json({ error: "Expected WebSocket upgrade header" }, 400);
  }

  // Forward the request to the Durable Object
  return chat.fetch(c.req.raw.clone());
});

export default app;
