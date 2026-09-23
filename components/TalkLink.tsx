"use client";

import type { ReactNode } from "react";
import { useChatWidget } from "@/components/chat/ChatContext";
import { CHAT_ENABLED, whatsappLink } from "@/lib/site-config";

export function TalkLink({
  className,
  message,
  children,
}: {
  className?: string;
  message: string;
  children: ReactNode;
}) {
  const { openChat } = useChatWidget();

  if (CHAT_ENABLED) {
    return (
      <button onClick={openChat} className={className}>
        {children}
      </button>
    );
  }

  return (
    <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
