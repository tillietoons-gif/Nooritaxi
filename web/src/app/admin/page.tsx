import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BodyMd, HeadingMd } from "@/components/ui/typography"
import { Bell, Car, Headphones, Package, ShieldCheck, Store, Users, Wallet } from "lucide-react"

export default function AdminPage() {
  const metrics = [
    { label: "Active riders", value: "18,420", icon: Users },
    { label: "Online drivers", value: "642", icon: Car },
    { label: "Open restaurants", value: "214", icon: Store },
    { label: "Wallet volume", value: "4.8M AFN", icon: Wallet },
  ]
  const queues = [
    { label: "Ride safety checks", value: "12", tone: "High" },
    { label: "Delivery disputes", value: "7", tone: "Normal" },
    { label: "Driver verifications", value: "34", tone: "Normal" },
    { label: "Support chats waiting", value: "19", tone: "High" },
  ]

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <HeadingMd className="text-2xl">Noori Operations</HeadingMd>
            <BodyMd className="text-muted-foreground">Admin control center for mobility, food, delivery, wallet, safety, and support.</BodyMd>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Bell className="mr-2 h-4 w-4" />Broadcast</Button>
            <Button><ShieldCheck className="mr-2 h-4 w-4" />Safety Review</Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                </div>
                <metric.icon className="h-6 w-6 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Live Marketplace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {["Rides", "Food orders", "Parcel delivery"].map((item, index) => (
                <div key={item} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item}</span>
                    {index === 0 ? <Car className="h-4 w-4 text-primary" /> : index === 1 ? <Store className="h-4 w-4 text-primary" /> : <Package className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-4 text-3xl font-bold">{[128, 76, 42][index]}</p>
                  <p className="text-sm text-muted-foreground">active right now</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Queues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queues.map((queue) => (
                <div key={queue.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{queue.label}</p>
                    <p className="text-sm text-muted-foreground">{queue.value} items</p>
                  </div>
                  <Badge variant={queue.tone === "High" ? "destructive" : "secondary"}>{queue.tone}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Headphones className="h-5 w-5" />Customer Support Chat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["Dari queue", "Pashto queue", "Merchant queue"].map((queue) => (
              <Button key={queue} variant="outline" className="h-16 justify-between">
                {queue}
                <Badge>Open</Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
