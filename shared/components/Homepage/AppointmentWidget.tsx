"use client";

import { useState, useRef, useEffect } from "react";
import { jetQuery } from "@/shared/api/jetRag";
import { SendHorizontal, ChevronDown } from "@/shared/components/icons";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

function extractDeliverText(answer: string): string {
  const marker = "4) Deliver";
  const idx = answer.indexOf(marker);
  if (idx === -1) {
    return answer.trim();
  }
  const afterMarker = answer.slice(idx + marker.length);
  return afterMarker.replace(/^[\s:\-–\n\r]+/, "").trim();
}

export default function AppointmentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(3);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: nextId.current++,
      from: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setIsLoading(true);
      const res = await jetQuery({
        query: userMessage.text,
      });
      const deliverText = extractDeliverText(res.answer);
      const reply: Message = {
        id: nextId.current++,
        from: "bot",
        text: deliverText,
      };
      setMessages((prev) => [...prev, reply]);
    } catch (error) {
      const reply: Message = {
        id: nextId.current++,
        from: "bot",
        text: "Sorry, something went wrong while contacting the assistant. Please try again.",
      };
      setMessages((prev) => [...prev, reply]);
    
      console.error("jetQuery error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[420px] h-[520px] max-w-[95vw] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col">

          <div className="px-4 py-3 border-b border-gray-200 bg-jet-blue text-white rounded-t-xl">
            <h2 className="text-sm font-semibold">
             Jet Prompt Optimizer
            </h2>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    msg.from === "user"
                      ? "bg-white text-gray-900 border border-gray-200"
                      : "bg-jet-blue text-white"
                  } max-w-[80%] whitespace-pre-line`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-1 rounded-lg bg-jet-blue px-3 py-2 shadow-sm">
                  <span
                    className="w-2 h-2 rounded-full bg-white/90 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-white/90 animate-bounce"
                    style={{ animationDelay: "120ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-white/90 animate-bounce"
                    style={{ animationDelay: "240ms" }}
                  />
                </div>
              </div>
            )}
          </div>

       
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-gray-200 px-3 py-2 bg-white rounded-b-xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border-none outline-none text-sm placeholder:text-gray-400 text-gray-900"
              placeholder="Type your question..."
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-jet-blue text-white text-xs hover:bg-jet-blue/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

    
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? "Minimize appointment assistant" : "Open appointment assistant"}
        className="h-14 w-14 rounded-full bg-jet-blue text-white shadow-lg flex items-center justify-center hover:bg-jet-blue/90 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <span className="text-2xl leading-none">💬</span>
        )}
      </button>
    </div>
  );
}


