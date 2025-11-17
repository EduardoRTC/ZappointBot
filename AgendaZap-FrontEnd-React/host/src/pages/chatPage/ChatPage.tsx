"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import "./ChatPage.css"

type MessageType = "user" | "bot" | "system"

type SocketPayload =
  | {
      type: "user_message"
      sender: string
      from: string
      body: string
      timestamp: string
    }
  | {
      type: "bot_message"
      sender: string
      to: string
      body: string
      timestamp: string
    }
  | {
      type: "qr_generated"
      qr: string
    }
  | {
      type: "qr_cleared"
    }
  | {
      type: "history"
      messages: {
        type: "user_message" | "bot_message"
        sender?: string
        from?: string
        to?: string
        body: string
        timestamp: string
      }[]
    }

type ChatMessage = {
  id: string
  author: string
  body: string
  timestamp?: string
  type: MessageType
}

const WS_ENDPOINT = "ws://localhost:8080"
const STATUS_ENDPOINT = "http://localhost:3001/status"
const QR_ENDPOINT = "http://localhost:3001/qr"
const RESET_ENDPOINT = "http://localhost:3001/reset-session"

const STORAGE_KEY_MESSAGES = "zappoint_chat_messages"
const STORAGE_KEY_CONNECTION = "zappoint_connection_state"
const STORAGE_KEY_AUTH = "zappoint_auth_state"

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

// Singleton WebSocket para manter conexão entre navegações
class WebSocketManager {
  private static instance: WebSocketManager | null = null
  private ws: WebSocket | null = null
  private listeners: Set<(data: SocketPayload) => void> = new Set()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private shouldReconnect = false

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  connect(onStatusChange?: (connected: boolean) => void) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      onStatusChange?.(true)
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return
    }

    this.shouldReconnect = true

    try {
      this.ws = new WebSocket(WS_ENDPOINT)

      this.ws.onopen = () => {
        console.log('[WS] Conectado')
        onStatusChange?.(true)
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_CONNECTION, 'true')
        }
      }

      this.ws.onclose = () => {
        console.log('[WS] Desconectado')
        onStatusChange?.(false)
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_CONNECTION, 'false')
        }
        
        // Reconectar automaticamente após 3 segundos
        if (this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            console.log('[WS] Tentando reconectar...')
            this.connect(onStatusChange)
          }, 3000)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WS] Erro:', error)
      }

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const data: SocketPayload = JSON.parse(event.data)
          this.listeners.forEach(listener => listener(data))
        } catch (err) {
          console.error('[WS] Erro ao parsear mensagem:', err)
        }
      }
    } catch (error) {
      console.error('[WS] Erro ao conectar:', error)
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CONNECTION, 'false')
    }
  }

  addListener(listener: (data: SocketPayload) => void) {
    this.listeners.add(listener)
  }

  removeListener(listener: (data: SocketPayload) => void) {
    this.listeners.delete(listener)
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)

  const wsManager = useRef(WebSocketManager.getInstance())
  const qrObjectUrlRef = useRef<string | null>(null)
  const messageListenerRef = useRef<((data: SocketPayload) => void) | null>(null)

  // Carrega mensagens do localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES)
        const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH)
        
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages) as ChatMessage[]
          if (Array.isArray(parsed)) {
            setMessages(parsed)
          }
        }

        if (savedAuth === 'true') {
          setIsAuthenticated(true)
        }
      }
    } catch (err) {
      console.error("Erro ao carregar do localStorage:", err)
    }
  }, [])

  // Salva mensagens no localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages))
      }
    } catch (err) {
      console.error("Erro ao salvar no localStorage:", err)
    }
  }, [messages])

  // Salva estado de autenticação
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AUTH, isAuthenticated ? 'true' : 'false')
      }
    } catch (err) {
      console.error("Erro ao salvar auth no localStorage:", err)
    }
  }, [isAuthenticated])

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const formatTimestamp = useCallback((isoDate?: string) => {
    if (!isoDate) return ""
    try {
      return new Date(isoDate).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return ""
    }
  }, [])

  const fetchQrImage = useCallback(async () => {
    try {
      const statusRes = await fetch(STATUS_ENDPOINT, { cache: "no-store" })
      if (!statusRes.ok) return

      const status = (await statusRes.json()) as {
        authenticated: boolean
        qrAvailable: boolean
      }

      if (status.authenticated) {
        setIsAuthenticated(true)
        if (qrObjectUrlRef.current) {
          URL.revokeObjectURL(qrObjectUrlRef.current)
          qrObjectUrlRef.current = null
        }
        setQrImageUrl(null)
        return
      }

      if (!status.qrAvailable) {
        setIsAuthenticated(false)
        return
      }

      const response = await fetch(QR_ENDPOINT, { cache: "no-store" })
      if (!response.ok) return

      setIsAuthenticated(false)
      const blob = await response.blob()
      if (qrObjectUrlRef.current) {
        URL.revokeObjectURL(qrObjectUrlRef.current)
      }
      const objectUrl = URL.createObjectURL(blob)
      qrObjectUrlRef.current = objectUrl
      setQrImageUrl(objectUrl)
    } catch (error) {
      console.error("Erro ao buscar QR code:", error)
    }
  }, [])

  // Listener de mensagens WebSocket
  useEffect(() => {
    const listener = (data: SocketPayload) => {
      if (data.type === "history") {
        const historyMessages: ChatMessage[] = data.messages.map((msg) => ({
          id: createId(),
          author: msg.type === "bot_message" ? "Bot" : msg.sender ?? "Usuário",
          body: msg.body,
          timestamp: msg.timestamp,
          type: msg.type === "bot_message" ? "bot" : "user",
        }))
        setMessages(historyMessages)
        return
      }

      if (data.type === "user_message") {
        appendMessage({
          id: createId(),
          author: data.sender,
          body: data.body,
          timestamp: data.timestamp,
          type: "user",
        })
        return
      }

      if (data.type === "bot_message") {
        appendMessage({
          id: createId(),
          author: "Bot",
          body: data.body,
          timestamp: data.timestamp,
          type: "bot",
        })
        return
      }

      if (data.type === "qr_generated") {
        setIsAuthenticated(false)
        appendMessage({
          id: createId(),
          author: "Sistema",
          body: "Novo QR code disponível. Faça a leitura para continuar.",
          type: "system",
        })
        setTimeout(() => fetchQrImage(), 500)
        return
      }

      if (data.type === "qr_cleared") {
        setIsAuthenticated(true)
        appendMessage({
          id: createId(),
          author: "Sistema",
          body: "QR code não é mais necessário. Sessão autenticada.",
          type: "system",
        })
        if (qrObjectUrlRef.current) {
          URL.revokeObjectURL(qrObjectUrlRef.current)
          qrObjectUrlRef.current = null
        }
        setQrImageUrl(null)
      }
    }

    messageListenerRef.current = listener
    wsManager.current.addListener(listener)

    return () => {
      if (messageListenerRef.current) {
        wsManager.current.removeListener(messageListenerRef.current)
      }
    }
  }, [appendMessage, fetchQrImage])

  // Auto-conectar ao montar e verificar conexão
  useEffect(() => {
    const checkAndConnect = () => {
      if (!wsManager.current.isConnected()) {
        wsManager.current.connect((connected) => {
          setIsConnected(connected)
          if (connected) {
            setConnectionError(null)
            fetchQrImage()
          }
        })
      } else {
        setIsConnected(true)
        fetchQrImage()
      }
    }

    checkAndConnect()

    // Verificar conexão periodicamente
    const interval = setInterval(() => {
      setIsConnected(wsManager.current.isConnected())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [fetchQrImage])

  // Polling do QR code quando conectado mas não autenticado
  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      const interval = setInterval(() => {
        fetchQrImage()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isConnected, isAuthenticated, fetchQrImage])

  // Limpar recursos ao desmontar (mas não desconectar WebSocket)
  useEffect(() => {
    const mainElement = document.querySelector<HTMLElement>(".dashboard-layout__main")
    if (mainElement) {
      mainElement.classList.add("dashboard-layout__main--chat")
    }

    return () => {
      if (qrObjectUrlRef.current) {
        URL.revokeObjectURL(qrObjectUrlRef.current)
        qrObjectUrlRef.current = null
      }
      if (mainElement) {
        mainElement.classList.remove("dashboard-layout__main--chat")
      }
    }
  }, [])

  const handleConnect = useCallback(() => {
    setConnectionError(null)
    wsManager.current.connect((connected) => {
      setIsConnected(connected)
      if (connected) {
        appendMessage({
          id: createId(),
          author: "Sistema",
          body: "Conectado ao servidor de mensagens.",
          type: "system",
        })
        fetchQrImage()
      } else {
        setConnectionError("Não foi possível conectar ao servidor.")
      }
    })
  }, [appendMessage, fetchQrImage])

  const handleDisconnect = useCallback(async () => {
    setConnectionError(null)
    setIsDisconnecting(true)

    try {
      await fetch(RESET_ENDPOINT, { method: "POST" })

      appendMessage({
        id: createId(),
        author: "Sistema",
        body: "Sessão desconectada. Arquivos de autenticação removidos.",
        type: "system",
      })

      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_MESSAGES)
        localStorage.removeItem(STORAGE_KEY_AUTH)
        localStorage.removeItem(STORAGE_KEY_CONNECTION)
      }

      setMessages([])
      setIsAuthenticated(false)
      
    } catch (error) {
      console.error("Erro ao desconectar:", error)
      setConnectionError("Não foi possível limpar a sessão do bot.")
    } finally {
      setIsDisconnecting(false)
    }

    wsManager.current.disconnect()
    setIsConnected(false)

    if (qrObjectUrlRef.current) {
      URL.revokeObjectURL(qrObjectUrlRef.current)
      qrObjectUrlRef.current = null
    }
    setQrImageUrl(null)
  }, [appendMessage])

  const statusLabel = useMemo(() => {
    if (!isConnected) return "Desconectado"
    return "Conectado"
  }, [isConnected])

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <header className="chat-sidebar__header">
          <h1>Central de Mensagens</h1>
          <p>Acompanhe as mensagens recebidas e enviadas pelo bot.</p>
        </header>

        <div className="chat-sidebar__actions">
          <button
            type="button"
            className="chat-button"
            onClick={handleConnect}
            disabled={isConnected}
          >
            {isConnected ? "Conectado" : "Conectar"}
          </button>

          <button
            type="button"
            className="chat-button chat-button--secondary"
            onClick={handleDisconnect}
            disabled={isDisconnecting || !isConnected}
          >
            {isDisconnecting ? "Desconectando..." : "Desconectar / limpar sessão"}
          </button>

          <span className={`chat-status chat-status--${isConnected ? "online" : "offline"}`}>
            Status: {statusLabel}
          </span>

          {connectionError && <p className="chat-error">{connectionError}</p>}
        </div>

        {!isAuthenticated && (
          <section className="chat-sidebar__qr">
            <h2>QR Code</h2>
            {qrImageUrl ? (
              <div>
                <img src={qrImageUrl} alt="QR code para autenticação" />
                <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
                  Escaneie o QR code com o WhatsApp para autenticar
                </p>
              </div>
            ) : (
              <p className="chat-sidebar__qr-empty">
                {isConnected
                  ? "Aguardando QR code do servidor..."
                  : "Conectando ao servidor de mensagens..."}
              </p>
            )}
          </section>
        )}

        {isAuthenticated && (
          <section className="chat-sidebar__qr">
            <h2>Status</h2>
            <p style={{ color: "#10b981", fontWeight: "500" }}>
              ✓ WhatsApp autenticado e pronto
            </p>
          </section>
        )}
      </div>

      <main className="chat-content">
        <header className="chat-content__header">
          <h2>Mensagens</h2>
        </header>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-messages__empty">
              <p>
                Nenhuma mensagem ainda. Assim que novas mensagens chegarem, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`chat-message chat-message--${message.type}`}>
                <div className="chat-message__meta">
                  <span className="chat-message__author">{message.author}</span>
                  {message.timestamp && (
                    <time className="chat-message__time">{formatTimestamp(message.timestamp)}</time>
                  )}
                </div>
                <p className="chat-message__body">{message.body}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}