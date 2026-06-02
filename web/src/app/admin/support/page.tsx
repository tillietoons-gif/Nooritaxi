"use client"

import { useState, useEffect } from "react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd, HeadingSm } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LifeBuoy, MessageSquare, Clock, ShieldAlert, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SupportAdminPage() {
  const [activeTicket, setActiveTicket] = useState<number | null>(1)
  const [tickets, setTickets] = useState([
    { id: 1, user: "Hamid R.", subject: "Driver never arrived", time: "2m ago", priority: "high", status: "open" },
    { id: 2, user: "Sara K.", subject: "Payment charged twice", time: "15m ago", priority: "critical", status: "open" },
    { id: 3, user: "Ali B.", subject: "App keeps crashing on booking", time: "1h ago", priority: "medium", status: "pending" },
    { id: 4, user: "Farid J.", subject: "Lost item in car", time: "2h ago", priority: "high", status: "pending" },
  ])

  // Mock incoming tickets
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setTickets(prev => [
          {
            id: Date.now(),
            user: "New Customer",
            subject: "Incoming chat request...",
            time: "Just now",
            priority: "medium",
            status: "open"
          },
          ...prev
        ])
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthGate requiredRole="ADMIN">
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8 max-h-screen overflow-hidden flex flex-col">
          <div className="mb-6 flex-shrink-0">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <LifeBuoy className="h-8 w-8 text-primary" />
              Live Support Desk
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Manage active customer chats, driver disputes, and emergency tickets.
            </BodyMd>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Ticket List Pane */}
            <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
              {tickets.map(ticket => (
                <Card 
                  key={ticket.id} 
                  className={`cursor-pointer transition-all hover:border-primary/50 ${activeTicket === ticket.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border/50'}`}
                  onClick={() => setActiveTicket(ticket.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">{ticket.user}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {ticket.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-3">{ticket.subject}</p>
                    <div className="flex gap-2">
                      <Badge variant={ticket.priority === 'critical' ? 'destructive' : ticket.priority === 'high' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {ticket.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary">
                        {ticket.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chat Pane */}
            <div className="w-2/3 flex flex-col glass-premium rounded-2xl border border-primary/10 overflow-hidden">
              {activeTicket ? (
                <>
                  <div className="p-4 border-b border-primary/10 bg-background/50 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">{tickets.find(t => t.id === activeTicket)?.user}</h3>
                        <p className="text-xs text-muted-foreground">{tickets.find(t => t.id === activeTicket)?.subject}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs">Resolve Ticket</Button>
                      <Button variant="destructive" size="sm" className="text-xs flex items-center gap-1">
                         <ShieldAlert className="h-3 w-3" /> Escalate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col">
                    <div className="bg-primary/10 p-3 rounded-2xl rounded-tl-sm max-w-[80%] self-start">
                      <p className="text-sm">Hello, I&apos;ve been waiting for 20 minutes and the driver hasn&apos;t moved on the map.</p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">10:42 AM</span>
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-tr-sm max-w-[80%] self-end">
                      <p className="text-sm">I&apos;m sorry to hear that. Let me check the driver&apos;s live GPS status right now.</p>
                      <span className="text-[10px] text-muted-foreground mt-1 block text-right">10:43 AM</span>
                    </div>
                    <div className="flex justify-center my-4">
                      <Badge variant="outline" className="text-[10px] font-normal border-primary/20 text-muted-foreground">System: Agent joined chat</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-primary/10 bg-background/50 flex gap-3 flex-shrink-0">
                    <input 
                      type="text" 
                      placeholder="Type your response..." 
                      className="flex-1 bg-background border border-input rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <Button className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-md shadow-primary/20">
                      <Send className="h-4 w-4 ml-0.5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <LifeBuoy className="h-16 w-16 mb-4 opacity-20" />
                  <HeadingSm>No Ticket Selected</HeadingSm>
                  <BodyMd>Select a customer support request from the queue to start assisting.</BodyMd>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}