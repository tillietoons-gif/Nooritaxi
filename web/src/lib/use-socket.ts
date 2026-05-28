"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { apiUrl, getToken } from "@/lib/auth"

function defaultSocketUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? apiUrl.replace(/\/api\/?$/, "")
}

export function useSocket(enabled = true) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const token = getToken()
    if (!token) return

    const nextSocket = io(defaultSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    nextSocket.on("connect", () => setConnected(true))
    nextSocket.on("disconnect", () => setConnected(false))
    setSocket(nextSocket)

    return () => {
      nextSocket.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [enabled])

  return { socket, connected }
}
