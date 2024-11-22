import * as React from "react"
import { cn } from "~/utils/misc"

export interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  className?: string
}

export function ChatMessage({ role, content, className }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg",
        role === 'assistant' 
          ? "bg-primary/10 text-primary-foreground"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          {role === 'assistant' ? '🤖' : '👤'}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">
            {role === 'assistant' ? 'AI Tutor' : 'You'}
          </p>
          <div className="prose dark:prose-invert">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}

export interface ChatProps {
  messages: ChatMessageProps[]
  className?: string
}

export function Chat({ messages, className }: ChatProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message, index) => (
        <ChatMessage key={index} {...message} />
      ))}
    </div>
  )
}
