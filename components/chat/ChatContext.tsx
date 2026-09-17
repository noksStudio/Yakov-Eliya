"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ChatContextValue = {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<ChatContextValue>(
    () => ({
      isOpen,
      openChat: () => setIsOpen(true),
      closeChat: () => setIsOpen(false),
      toggleChat: () => setIsOpen((v) => !v),
    }),
    [isOpen]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatWidget() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatWidget must be used within ChatProvider");
  return ctx;
}
