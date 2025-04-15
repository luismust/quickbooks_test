"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'
import { resetThread } from '@/lib/openai'
import { useChatStore } from '@/lib/store/chat-store'

interface Message {
  id: string
  text: string
  isUser: boolean
}

const predefinedMessages = [
  "How do I create a new question?",
  "How do I add images to my questions?",
  "How do I configure the scoring?",
  "How do I edit an existing test?"
]

// Definir los estados posibles
type LoadingState = 'creating' | 'thinking' | 'responding' | null;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<LoadingState>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Usar el store global en lugar del estado local
  const { messages, addMessage, clearMessages } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handlePredefinedMessage = async (message: string) => {
    setInput(message)
    await handleSend(message)
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend.trim(),
      isUser: true
    }

    addMessage(userMessage) // Usar addMessage del store
    setInput("")
    setIsLoading(true)

    try {
      // Estado 'creating' - 3 segundos
      setLoadingState('creating')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Estado 'thinking' - 4 segundos
      setLoadingState('thinking')
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      const data = await response.json()
      
      // Estado 'responding' - 3 segundos
      setLoadingState('responding')
      await new Promise(resolve => setTimeout(resolve, 3000))

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false
      }

      addMessage(botMessage) // Usar addMessage del store
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error("Failed to get response")
    } finally {
      setIsLoading(false)
      setLoadingState(null)
    }
  }

  const handleToggle = () => {
    if (isOpen) {
      handleClose()
    } else {
      setIsOpen(true)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // No limpiamos los mensajes al cerrar
    resetThread()
  }

  const LoadingMessage = () => {
    const messages = {
      creating: [
        "🤖 Waking up the AI assistant from its nap...",
        "🔌 Plugging in my thinking cap...",
        "🚀 Initiating launch sequence...",
        "🎮 Loading AI power-ups...",
        "🌟 Channeling digital wisdom...",
        "🎩 Pulling answers from my magic hat..."
      ],
      thinking: [
        "🤔 Hmm... let me think about that one...",
        "🧠 Processing at maximum capacity...",
        "📚 Consulting my virtual library...",
        "🎯 Analyzing all possibilities...",
        "🔍 Searching through the knowledge matrix...",
        "🌍 Exploring the digital universe...",
        "🎲 Rolling the dice of wisdom...",
        "🧩 Putting the pieces together..."
      ],
      responding: [
        "✨ Creating some magic for you...",
        "🎨 Painting your answer with words...",
        "🎯 Almost there, finalizing response...",
        "🎭 Preparing a dramatic reveal...",
        "📝 Adding the finishing touches...",
        "🎪 Preparing the grand finale...",
        "🎬 Action! Final scene coming up...",
        "🎼 Composing the perfect response..."
      ]
    }

    const [messageIndex, setMessageIndex] = useState(0)

    useEffect(() => {
      if (!loadingState) return

      const interval = setInterval(() => {
        setMessageIndex(prev => 
          prev >= messages[loadingState].length - 1 ? 0 : prev + 1
        )
      }, 2000) // Cambiar mensaje cada 2 segundos

      return () => clearInterval(interval)
    }, [loadingState])

    const dots = "...".split("").map((dot, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          delay: i * 0.2
        }}
      >
        {dot}
      </motion.span>
    ))

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start items-center"
      >
        <div className="rounded-lg px-4 py-2 bg-muted flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AnimatePresence mode="wait">
            <motion.span
              key={messageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm flex items-center gap-1"
            >
              {loadingState && (
                <>
                  {messages[loadingState][messageIndex]}
                  <span className="inline-flex">{dots}</span>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 p-0 shadow-lg hover:scale-110 transition-transform"
        onClick={handleToggle}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 w-96 z-50"
          >
            <Card className="overflow-hidden shadow-xl border-2">
              <motion.div 
                className="bg-white p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-black" />
                  <h3 className="font-semibold text-black">Masterfy</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-black hover:bg-gray-100"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>

              {messages.length === 0 && (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Frequently Asked Questions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {predefinedMessages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full text-sm text-left h-auto whitespace-normal
                            hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => handlePredefinedMessage(msg)}
                        >
                          {msg}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-[400px] overflow-y-auto p-4 space-y-4 scrollbar-hide">
                <style jsx global>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                  
                  .scrollbar-hide {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                  }
                `}</style>
                
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.isUser ? (
                          message.text
                        ) : (
                          <ReactMarkdown
                            components={{
                              strong: ({ children }) => (
                                <span className="font-bold">{children}</span>
                              )
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && <LoadingMessage />}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Write your message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSend()
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleSend()} 
                    disabled={isLoading}
                    className="hover:scale-105 transition-transform"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 