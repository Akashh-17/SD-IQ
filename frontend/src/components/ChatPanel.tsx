import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Bot,
  Mic,
  SendHorizontal,
  User,
} from "lucide-react";

import { sendInterviewMessage } from "../services/chat.service";
import speechService from "../services/speechService";
import { transcribeAudio } from "../services/voiceService";
import { initializeInterview } from "../services/initializeInterview.service";
import { getInterviewState } from "../services/interviewState.service";

type Message = {

  role: "user" | "ai";

  text: string;

};

export default function ChatPanel() {

  const { interviewId } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");

  const [listening, setListening] = useState(false);

  const [thinking, setThinking] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  // =====================================================
  // Speech
  // =====================================================

  useEffect(() => {

    speechService.init(

      async (blob: Blob) => {

        try {

          setThinking(true);

          const transcript =
            await transcribeAudio(blob);

          setInput(transcript);

        }

        catch (err) {

          console.error(err);

        }

        finally {

          setThinking(false);

        }

      },

      () => {

        speechService.stopSpeaking();

      },

    );

    async function startInterview() {

      if (!interviewId)

        return;

      try {

        setThinking(true);

        const state =
          await getInterviewState(interviewId);

        if (

          state.transcript &&

          state.transcript.length > 0

        ) {

          const restored =
            state.transcript.map((m: any) => ({

              role:

                m.role === "assistant"

                  ? "ai"

                  : "user",

              text: m.content,

            }));

          setMessages(restored);

          return;

        }

        const { reply } =
          await initializeInterview(

            interviewId

          );

        setMessages([

          {

            role: "ai",

            text: reply,

          },

        ]);

        speechService.speak(reply);

      }

      catch (err) {

        console.error(err);

      }

      finally {

        setThinking(false);

      }

    }

    startInterview();

  }, []);

  // =====================================================
  // Scroll
  // =====================================================

  useEffect(() => {

    bottomRef.current?.scrollIntoView({

      behavior: "smooth",

    });

  }, [messages]);

  // =====================================================
  // Auto Resize Textarea
  // =====================================================

  useEffect(() => {

    const textarea = textareaRef.current;

    if (!textarea)

      return;

    textarea.style.height = "24px";

    textarea.style.height =
      Math.min(textarea.scrollHeight, 140) + "px";

  }, [input]);

  // =====================================================
  // Send
  // =====================================================

  async function handleSend() {

    const text = input.trim();

    if (!text)

      return;

    setMessages((prev) => [

      ...prev,

      {

        role: "user",

        text,

      },

    ]);

    setInput("");

    setThinking(true);

    try {

      const reply =
        await sendInterviewMessage(

          interviewId!,

          text

        );

      setMessages((prev) => [

        ...prev,

        {

          role: "ai",

          text: reply,

        },

      ]);

      speechService.speak(reply);

    }

    catch (err) {

      console.error(err);

      setMessages((prev) => [

        ...prev,

        {

          role: "ai",

          text: "Unable to contact the AI interviewer.",

        },

      ]);

    }

    finally {

      setThinking(false);

    }

  }

  // =====================================================
  // Voice
  // =====================================================

  async function toggleMic() {

    if (listening) {

      await speechService.stop();

      setListening(false);

      return;

    }

    setInput("");

    await speechService.start();

    setListening(true);

  }
  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="flex h-full flex-col bg-[#09090B]">

      {/* Header */}

      <div
        className="
        flex
        h-10
        shrink-0
        items-center
        justify-between
        border-b
        border-white/10
        bg-[#101114]
        px-4
    "
      >

        <div className="flex items-center gap-2">

          <Bot
            size={15}
            className="text-[#F5B301]"
          />

          <span className="text-sm font-medium text-white">

            AI Interviewer

          </span>

        </div>

        <div className="flex items-center gap-2">

          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />

          <span className="text-xs text-green-400">

            Listening

          </span>

        </div>

      </div>

      {/* Messages */}

      <div className="flex-1 overflow-y-auto">

        <div className="mx-auto max-w-4xl px-5 py-5">

          <div className="space-y-5">

            {

              messages.map((m, i) => (

                <div

                  key={i}

                  className={`

                            flex

                            gap-3

                            ${m.role === "user"

                      ? "flex-row-reverse"

                      : ""

                    }

                        `}

                >

                  <div

                    className={`

                                mt-1

                                flex

                                h-8

                                w-8

                                shrink-0

                                items-center

                                justify-center

                                rounded-full

                                ${m.role === "ai"

                        ? "bg-[#F5B301]/10"

                        : "bg-indigo-500/10"

                      }

                            `}

                  >

                    {

                      m.role === "ai"

                        ? (

                          <Bot

                            size={15}

                            className="text-[#F5B301]"

                          />

                        )

                        : (

                          <User

                            size={15}

                            className="text-indigo-400"

                          />

                        )

                    }

                  </div>

                  <div

                    className={`

                                max-w-[78%]

                                rounded-xl

                                px-4

                                py-3

                                text-[14px]

                                leading-6

                                whitespace-pre-wrap

                                shadow-sm

                                ${m.role === "ai"

                        ? "border border-white/10 bg-[#17181C] text-gray-200"

                        : "bg-indigo-600 text-white"

                      }

                            `}

                  >

                    {m.text}

                  </div>

                </div>

              ))

            }

            {

              thinking && (

                <div className="flex gap-3">

                  <div
                    className="
                                mt-1
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-[#F5B301]/10
                            "
                  >

                    <Bot

                      size={15}

                      className="text-[#F5B301]"

                    />

                  </div>

                  <div
                    className="
                                rounded-xl
                                border
                                border-white/10
                                bg-[#17181C]
                                px-4
                                py-3
                            "
                  >

                    <div className="flex items-center gap-2">

                      <span className="text-sm text-gray-300">

                        Thinking

                      </span>

                      <div className="flex gap-1">

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5B301]" />

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5B301] [animation-delay:150ms]" />

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5B301] [animation-delay:300ms]" />

                      </div>

                    </div>

                  </div>

                </div>

              )

            }

            <div ref={bottomRef} />

          </div>

        </div>

      </div>

      {/* Input */}

      <div className="border-t border-white/10 bg-[#101114] px-5 py-3">

        <div className="mx-auto max-w-4xl">

          <div
            className="
                flex
                items-end
                gap-3
                rounded-xl
                border
                border-white/10
                bg-[#17181C]
                px-4
                py-3
                transition-all
                duration-200
                focus-within:border-[#F5B301]/70
            "
          >

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Explain your design..."
              style={{
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
              className="
        min-h-[24px]
        max-h-[140px]
        flex-1
        resize-none
        overflow-y-auto
        overflow-x-hidden
        whitespace-pre-wrap
        break-words
        bg-transparent
        py-1
        text-[15px]
        leading-6
        text-white
        placeholder:text-gray-500
        outline-none
    "
            />

            <div className="flex items-center gap-2 pb-1">

              <button

                onClick={toggleMic}

                className={`

                        flex

                        h-7

                        w-7

                        shrink-0

                        items-center

                        justify-center

                        rounded-lg

                        transition-all

                        duration-200

                        ${listening

                    ? "bg-red-500 text-white"

                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"

                  }

                    `}
              >

                <Mic size={17} />

              </button>

              <button

                onClick={handleSend}

                disabled={!input.trim()}

                className="

                        flex

                        h-7

                        w-7

                        shrink-0

                        items-center

                        justify-center

                        rounded-lg

                        bg-[#F5B301]

                        text-black

                        transition-all

                        duration-200

                        hover:brightness-110

                        disabled:cursor-not-allowed

                        disabled:opacity-40

                    "

              >

                <SendHorizontal

                  size={17}

                />

              </button>

            </div>

          </div>

          <div className="mt-2 flex items-center justify-between px-1">

            <span className="text-xs text-gray-500">

              Press <span className="text-gray-300">Enter</span> to send · <span className="text-gray-300">Shift + Enter</span> for newline

            </span>

            <span className="text-xs text-gray-600">

              AI Interview

            </span>

          </div>

        </div>

      </div>

    </div>

  );

}