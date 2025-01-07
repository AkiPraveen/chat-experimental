"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChannelList } from "@/components/channel-list";
import { NameDialog } from "@/components/name-dialog";
import { User } from "lucide-react";
import { getUserColor } from "@/lib/colors";

interface Message {
  type: "system" | "user";
  name?: string;
  text: string;
}

interface ChatState {
  messages: Message[];
  isConnected: boolean;
}

export default function Home() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [activeChannel, setActiveChannel] = useState("general");
  const [chatStates, setChatStates] = useState<Record<string, ChatState>>({
    general: { messages: [], isConnected: false },
  });
  const [userName, setUserName] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentChatState = chatStates[activeChannel] || { messages: [], isConnected: false };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };

    // Scroll immediately
    scrollToBottom();

    // Also scroll after a short delay to handle dynamic content loading
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [currentChatState.messages]);

  // Handle WebSocket connection when channel changes
  useEffect(() => {
    if (!userName) return;

    // Clean up previous connection
    if (ws) {
      ws.close();
      setWs(null);
    }

    setIsConnecting(true);

    const wsConnection = new WebSocket(`ws://localhost:8787/api/chat/${activeChannel}`);

    wsConnection.onopen = () => {
      setWs(wsConnection);
      setIsConnecting(false);
      setChatStates(prev => ({
        ...prev,
        [activeChannel]: { ...prev[activeChannel], isConnected: true },
      }));
      wsConnection.send(JSON.stringify({
        name: userName,
        connectionEstablished: true,
      }));
    };

    wsConnection.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setChatStates(prev => ({
        ...prev,
        [activeChannel]: {
          ...prev[activeChannel],
          messages: [...prev[activeChannel].messages, message],
        },
      }));
    };

    wsConnection.onclose = () => {
      setChatStates(prev => ({
        ...prev,
        [activeChannel]: { ...prev[activeChannel], isConnected: false },
      }));
      setWs(null);
      setIsConnecting(false);
    };

    wsConnection.onerror = (error) => {
      console.error("WebSocket error:", error);
      alert("Error connecting to chat server");
      setIsConnecting(false);
    };

    // Cleanup on channel change or unmount
    return () => {
      wsConnection.close();
    };
  }, [activeChannel, userName]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      name: userName,
      text: inputMessage,
    }));
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleChannelSelect = (channel: string) => {
    setActiveChannel(channel);
    setChatStates(prev => ({
      ...prev,
      [channel]: prev[channel] || { messages: [], isConnected: false },
    }));
  };

  const handleNameSubmit = (name: string) => {
    setUserName(name);
  };

  return (
    <>
      <NameDialog onNameSubmit={handleNameSubmit} />
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden w-64 border-r md:block">
          <div className="flex h-full flex-col">
            <div className="shrink-0 p-4 font-semibold border-b">Chat Experimental</div>
            <div className="flex-1 overflow-auto">
              <ChannelList
                activeChannel={activeChannel}
                onChannelSelect={handleChannelSelect}
              />
            </div>
            {userName && (
              <div className="shrink-0 border-t p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{userName}</span>
              </div>
            )}
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <div className="flex h-full">
            <Card className="flex-1 flex flex-col m-4">
              <div className="shrink-0 border-b p-4 font-medium">
                #{activeChannel}
                {isConnecting && <span className="ml-2 text-sm text-muted-foreground">(Connecting...)</span>}
              </div>
              <ScrollArea 
                className="flex-1 min-h-0"
                ref={scrollAreaRef}
              >
                <div className="p-4 space-y-2">
                  {currentChatState.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-2 ${
                        message.type === "system"
                          ? "bg-muted font-medium"
                          : ""
                      }`}
                      style={
                        message.type === "system"
                          ? {}
                          : { backgroundColor: getUserColor(message.name || '') }
                      }
                    >
                      {message.type === "system" ? (
                        message.text
                      ) : (
                        <>
                          <span className="font-medium">{message.name}</span>: {message.text}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <div className="shrink-0 p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isConnecting}
                  />
                  <Button onClick={sendMessage} disabled={isConnecting}>
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
