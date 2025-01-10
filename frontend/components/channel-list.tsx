"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, X } from "lucide-react";

interface ChannelListProps {
  activeChannel: string;
  onChannelSelect: (channel: string) => void;
}

export function ChannelList({ activeChannel, onChannelSelect }: ChannelListProps) {
  const [channels, setChannels] = useState<string[]>(["general"]);
  const [newChannel, setNewChannel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddChannel = () => {
    if (newChannel.trim()) {
      setChannels((prev) => [...prev, newChannel.trim()]);
      setNewChannel("");
      setIsAdding(false);
    }
  };

  const handleRemoveChannel = (channel: string) => {
    if (channel === "general") return; // Prevent removing the general channel
    setChannels((prev) => prev.filter((c) => c !== channel));
    if (activeChannel === channel) {
      onChannelSelect("general");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddChannel();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewChannel("");
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm">Channels</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAdding(true)}
          className="h-8 w-8"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      
      {isAdding && (
        <div className="flex gap-2 items-center">
          <Input
            placeholder="channel-name"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            onKeyDown={handleKeyPress}
            className="h-8"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAdding(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1">
          {channels.map((channel) => (
            <div
              key={channel}
              className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                activeChannel === channel
                  ? "bg-primary/10"
                  : "hover:bg-muted"
              }`}
            >
              <button
                className="flex-1 text-left"
                onClick={() => onChannelSelect(channel)}
              >
                # {channel}
              </button>
              {channel !== "general" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveChannel(channel)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 