"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertTriangle, Banknote, Car, CheckCircle, ChevronLeft, Clock, CreditCard, Download, FileText, MessageSquare, ShieldAlert, Star, User, XCircle } from "lucide-react"
import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiUrl, authedFetch } from "@/lib/auth"

type DriverDoc = {
  id: string
  type: string
  status: "PENDING" | "VERIFIED" | "REJECTED"
  url: string
  updatedAt: string
  createdAt?: string
  verifiedAt?: string | null
}

type Vehicle = {
  id?: string
  type?: string
  make?: string | null
  model?: string | null
  plateNumber?: string | null
  color?: string | null
  status?: string
}

type DriverDetails = {
  id: string
  userId: string
  nationalIdNumber?: string | null
  licenseNumber?: string | null
  status: "OFFLINE" | "ONLINE" | "BUSY" | "SUSPENDED"
  tier?: string
  ratingAverage?: number | null
  completedTrips?: number
  completedDeliveries?: number
  acceptsCash?: boolean
  acceptsWallet?: boolean
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
    status?: string
    isVerified?: boolean
    createdAt?: string
  } | null
  vehicles?: Vehicle[]
  documents: DriverDoc[]
}

type DriverOperations = {
  summary: {
    completedTrips: number
    completedDeliveries: number
    totalTripFare: number
    totalDeliveryFees: number
    openIncidents: number
    unresolvedFraudAlerts: number
  }
  trips: any[]
  deliveries: any[]
  wallets: any[]
  settlements: any[]
  reviews: any[]
  incidents: any[]
  fraud: { score: any | null; cases: any[]; alerts: any[] }
  audits: any[]
}

type ProfileForm = {
  name: string
  email: string
  licenseNumber: string
  nationalIdNumber: string
  tier: string
  acceptsCash: boolean
  acceptsWallet: boolean
  vehicleType: string
  vehicleMake: string
  vehicleModel: string
  vehicleColor: string
  vehiclePlateNumber: string
}

const emptyOps: DriverOperations = {
  summary: {
    completedTrips: 0,
    completedDeliveries: 0,
    totalTripFare: 0,
    totalDeliveryFees: 0,
    openIncidents: 0,
    unresolvedFraudAlerts: 0,
  },
  trips: [],
  deliveries: [],
  wallets: [],
  settlements: [],
  reviews: [],
  incidents: [],
  fraud: { score: null, cases: [], alerts: [] },
  audits: [],
}

const money = (value: unknown) => `${Number(value ?? 0).toLocaleString()} AFN`
const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-")
const statusVariant = (status?: string | null) => {
  const upper = (status ?? "").toUpperCase()
  if (upper.includes("SUSPENDED") || upper.includes("REJECTED") || upper.includes("CANCELLED") || upper.includes("FAILED")) return "destructive"
  if (upper.includes("ACTIVE") || upper.includes("ONLINE") || upper.includes("VERIFIED") || upper.includes("COMPLETED") || upper.includes("DELIVERED")) return "default"
  return "secondary"
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{text}</p>
}

export default function DriverDetailsPage() {
  const { id } = useParams()
  const [driver, setDriver] = useState<DriverDetails | null>(null)
  const [operations, setOperations] = useState<DriverOperations>(emptyOps)
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const primaryVehicle = driver?.vehicles?.[0]
  const vehicleModel = [primaryVehicle?.make, primaryVehicle?.model].filter(Boolean).join(" ") || "No vehicle"
  const plateNumber = primaryVehicle?.plateNumber ?? "No plate"
  const phone = driver?.user?.phone ?? ""

  const loadDriver = useCallback(async () => {
    setLoading(true)
    try {
      const [driverResponse, opsResponse] = await Promise.all([
        authedFetch(`/admin/drivers/${id}`),
        authedFetch(`/admin/drivers/${id}/operations`),
      ])
      if (!driverResponse.ok) throw new Error(`Failed to load driver (${driverResponse.status})`)
      if (!opsResponse.ok) throw new Error(`Failed to load driver operations (${opsResponse.status})`)
      const nextDriver = (await driverResponse.json()) as DriverDetails
      setDriver(nextDriver)
      setOperations((await opsResponse.json()) as DriverOperations)
      setProfileForm({
        name: nextDriver.user?.name ?? "",
        email: nextDriver.user?.email ?? "",
        licenseNumber: nextDriver.licenseNumber ?? "",
        nationalIdNumber: nextDriver.nationalIdNumber ?? "",
        tier: nextDriver.tier ?? "BRONZE",
        acceptsCash: Boolean(nextDriver.acceptsCash),
        acceptsWallet: Boolean(nextDriver.acceptsWallet),
        vehicleType: nextDriver.vehicles?.[0]?.type ?? "CAR",
        vehicleMake: nextDriver.vehicles?.[0]?.make ?? "",
        vehicleModel: nextDriver.vehicles?.[0]?.model ?? "",
        vehicleColor: nextDriver.vehicles?.[0]?.color ?? "",
        vehiclePlateNumber: nextDriver.vehicles?.[0]?.plateNumber ?? "",
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load driver")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadDriver()
  }, [loadDriver])

  const documentUrl = (url: string) => {
    if (/^https?:\/\//i.test(url)) return url
    const baseUrl = apiUrl.replace(/\/api\/?$/, "")
    return `${baseUrl}/${url.replace(/^\//, "")}`
  }

  const requiredDocs = useMemo(() => {
    const approved = new Set(driver?.documents.filter((doc) => doc.status === "VERIFIED").map((doc) => doc.type) ?? [])
    return [
      { label: "Driver license", ok: approved.has("DRIVERS_LICENSE") },
      { label: "Vehicle registration", ok: approved.has("VEHICLE_REGISTRATION") },
      { label: "ID card", ok: approved.has("ID_CARD") },
    ]
  }, [driver?.documents])

  async function updateDriverStatus(status: DriverDetails["status"]) {
    if (!driver) return
    setActionLoading(status)
    try {
      const response = await authedFetch(`/admin/drivers/${driver.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error(`Failed to update driver (${response.status})`)
      await loadDriver()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update driver")
    } finally {
      setActionLoading(null)
    }
  }

  async function saveProfile() {
    if (!driver || !profileForm) return
    setActionLoading("profile")
    try {
      const response = await authedFetch(`/admin/drivers/${driver.id}/profile`, {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      })
      if (!response.ok) throw new Error(`Failed to save profile (${response.status})`)
      await loadDriver()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setActionLoading(null)
    }
  }

  async function updateDocumentStatus(docId: string, status: DriverDoc["status"]) {
    if (!driver) return
    setActionLoading(`${docId}:${status}`)
    try {
      const response = await authedFetch(`/admin/drivers/${driver.id}/documents/${docId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error(`Failed to update document (${response.status})`)
      await loadDriver()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading driver profile...</div>
  if (!driver) return <div className="p-8 text-sm text-muted-foreground">Driver not found</div>

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20 space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/drivers">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Drivers
            </Link>
          </Button>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{driver.user?.name ?? "Unnamed driver"}</CardTitle>
                    <p className="text-sm text-muted-foreground">{driver.user?.email ?? phone}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={statusVariant(driver.status)}>{driver.status}</Badge>
                      <Badge variant={statusVariant(driver.user?.status)}>{driver.user?.status ?? "NO_USER_STATUS"}</Badge>
                      <Badge variant={driver.user?.isVerified ? "default" : "secondary"}>
                        {driver.user?.isVerified ? "Verified" : "Verification pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={!phone} onClick={() => { window.location.href = `sms:${phone}` }}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Button>
                  <Button disabled={Boolean(actionLoading) || driver.status !== "SUSPENDED"} onClick={() => updateDriverStatus("OFFLINE")}>
                    Activate
                  </Button>
                  <Button variant="destructive" disabled={Boolean(actionLoading) || driver.status === "SUSPENDED"} onClick={() => updateDriverStatus("SUSPENDED")}>
                    Suspend
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{vehicleModel}</p>
                <p className="text-muted-foreground">{plateNumber}</p>
                <p className="text-muted-foreground">{primaryVehicle?.type ?? "No type"} · {primaryVehicle?.color ?? "No color"}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStat label="Trips" value={operations.summary.completedTrips} icon={Car} />
            <MiniStat label="Deliveries" value={operations.summary.completedDeliveries} icon={CheckCircle} />
            <MiniStat label="Trip Fare" value={money(operations.summary.totalTripFare)} icon={Banknote} />
            <MiniStat label="Delivery Fees" value={money(operations.summary.totalDeliveryFees)} icon={CreditCard} />
            <MiniStat label="Incidents" value={operations.summary.openIncidents} icon={AlertTriangle} />
            <MiniStat label="Fraud Alerts" value={operations.summary.unresolvedFraudAlerts} icon={ShieldAlert} />
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              <TabsTrigger value="trips">Trips</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader><CardTitle>Driver Profile</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {profileForm ? (
                    <>
                      <label className="space-y-1 text-sm font-medium">Name<Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></label>
                      <label className="space-y-1 text-sm font-medium">Email<Input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></label>
                      <label className="space-y-1 text-sm font-medium">License Number<Input value={profileForm.licenseNumber} onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })} /></label>
                      <label className="space-y-1 text-sm font-medium">National ID<Input value={profileForm.nationalIdNumber} onChange={(e) => setProfileForm({ ...profileForm, nationalIdNumber: e.target.value })} /></label>
                      <label className="space-y-1 text-sm font-medium">Tier<select className="h-8 w-full rounded-lg border bg-background px-2 text-sm" value={profileForm.tier} onChange={(e) => setProfileForm({ ...profileForm, tier: e.target.value })}>{["BRONZE", "SILVER", "GOLD", "PLATINUM"].map((tier) => <option key={tier}>{tier}</option>)}</select></label>
                      <div className="flex items-center gap-4 pt-6 text-sm">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={profileForm.acceptsCash} onChange={(e) => setProfileForm({ ...profileForm, acceptsCash: e.target.checked })} /> Accepts cash</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={profileForm.acceptsWallet} onChange={(e) => setProfileForm({ ...profileForm, acceptsWallet: e.target.checked })} /> Accepts wallet</label>
                      </div>
                      <div className="md:col-span-2"><Button disabled={actionLoading === "profile"} onClick={saveProfile}>Save Profile</Button></div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kyc">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <Card>
                  <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {requiredDocs.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span>{item.label}</span>
                        <Badge variant={item.ok ? "default" : "secondary"}>{item.ok ? "Verified" : "Missing"}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {driver.documents.length === 0 ? <EmptyState text="No documents have been uploaded for this driver." /> : driver.documents.map((doc) => (
                      <div key={doc.id} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[220px_1fr]">
                        <img src={documentUrl(doc.url)} alt={doc.type} className="aspect-video w-full rounded-md bg-muted object-cover" />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div><p className="font-semibold">{doc.type}</p><p className="text-xs text-muted-foreground">Updated {dateTime(doc.updatedAt ?? doc.createdAt)}</p></div>
                            <Badge variant={statusVariant(doc.status)}>{doc.status}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => window.open(documentUrl(doc.url), "_blank")}><Download className="mr-2 h-4 w-4" /> Open</Button>
                            <Button size="sm" variant="destructive" disabled={Boolean(actionLoading)} onClick={() => updateDocumentStatus(doc.id, "REJECTED")}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                            <Button size="sm" disabled={Boolean(actionLoading)} onClick={() => updateDocumentStatus(doc.id, "VERIFIED")}><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vehicle">
              <Card>
                <CardHeader><CardTitle>Vehicle Assignment</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {profileForm ? (
                    <>
                      <label className="space-y-1 text-sm font-medium">Type<select className="h-8 w-full rounded-lg border bg-background px-2 text-sm" value={profileForm.vehicleType} onChange={(e) => setProfileForm({ ...profileForm, vehicleType: e.target.value })}>{["CAR", "MOTORBIKE", "RICKSHAW", "VAN", "TRUCK", "BICYCLE"].map((type) => <option key={type}>{type}</option>)}</select></label>
                      <label className="space-y-1 text-sm font-medium">Plate Number<Input value={profileForm.vehiclePlateNumber} onChange={(e) => setProfileForm({ ...profileForm, vehiclePlateNumber: e.target.value })} /></label>
                      <label className="space-y-1 text-sm font-medium">Make<Input value={profileForm.vehicleMake} onChange={(e) => setProfileForm({ ...profileForm, vehicleMake: e.target.value })} /></label>
                      <label className="space-y-1 text-sm font-medium">Model<Input value={profileForm.vehicleModel} onChange={(e) => setProfileForm({ ...profileForm, vehicleModel: e.target.value })} /></label>
                      <label className="space-y-1 text-sm font-medium">Color<Input value={profileForm.vehicleColor} onChange={(e) => setProfileForm({ ...profileForm, vehicleColor: e.target.value })} /></label>
                      <div className="md:col-span-2"><Button disabled={actionLoading === "profile"} onClick={saveProfile}>Save Vehicle</Button></div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trips">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Recent Trips</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {operations.trips.length === 0 ? <EmptyState text="No recent trips found." /> : operations.trips.map((trip) => (
                      <div key={trip.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between gap-2"><span className="font-medium">{trip.pickupLocation} to {trip.dropoffLocation}</span><Badge variant={statusVariant(trip.status)}>{trip.status}</Badge></div>
                        <p className="mt-2 text-muted-foreground">{money(trip.fare)} · {trip.paymentMethod} · {dateTime(trip.createdAt)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Recent Deliveries</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {operations.deliveries.length === 0 ? <EmptyState text="No recent deliveries found." /> : operations.deliveries.map((delivery) => (
                      <div key={delivery.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between gap-2"><span className="font-medium">{delivery.pickupAddress} to {delivery.dropoffAddress}</span><Badge variant={statusVariant(delivery.status)}>{delivery.status}</Badge></div>
                        <p className="mt-2 text-muted-foreground">{money(delivery.fee)} · {dateTime(delivery.createdAt)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="wallet">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Wallets</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {operations.wallets.length === 0 ? <EmptyState text="No wallet records found." /> : operations.wallets.map((wallet) => (
                      <div key={wallet.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between"><span className="font-medium">{wallet.type} · {wallet.currency}</span><span>{money(wallet.balance)}</span></div>
                        <p className="text-muted-foreground">{wallet.isFrozen ? "Frozen" : "Active"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Settlements</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {operations.settlements.length === 0 ? <EmptyState text="No settlement records found." /> : operations.settlements.map((settlement) => (
                      <div key={settlement.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between"><span className="font-medium">{settlement.status}</span><span>{money(settlement.netBalance)}</span></div>
                        <p className="text-muted-foreground">Earned {money(settlement.totalEarned)} · Cash {money(settlement.cashCollected)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader><CardTitle>Ratings & Reviews</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {operations.reviews.length === 0 ? <EmptyState text="No reviews found." /> : operations.reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex justify-between"><span className="font-medium flex items-center gap-1"><Star className="h-4 w-4 text-primary" /> {review.rating}/5</span><span className="text-muted-foreground">{dateTime(review.createdAt)}</span></div>
                      <p className="mt-2">{review.comment ?? "No comment"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{review.author?.name ?? review.author?.phone ?? "Unknown author"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle>Fraud Score</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-3xl font-bold">{operations.fraud.score?.score ?? 0}</p>
                    <Badge variant={statusVariant(operations.fraud.score?.riskLevel)}>{operations.fraud.score?.riskLevel ?? "LOW"}</Badge>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>Incidents & Alerts</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[...operations.incidents, ...operations.fraud.alerts].length === 0 ? <EmptyState text="No incidents or fraud alerts found." /> : (
                      <>
                        {operations.incidents.map((incident) => <div key={incident.id} className="rounded-lg border p-3 text-sm"><Badge variant={statusVariant(incident.status)}>{incident.status}</Badge><p className="mt-2 font-medium">{incident.title}</p><p className="text-muted-foreground">{incident.description ?? incident.type}</p></div>)}
                        {operations.fraud.alerts.map((alert) => <div key={alert.id} className="rounded-lg border p-3 text-sm"><Badge variant={alert.isResolved ? "default" : "destructive"}>{alert.isResolved ? "RESOLVED" : alert.severity}</Badge><p className="mt-2 font-medium">{alert.message}</p><p className="text-muted-foreground">{alert.type}</p></div>)}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {operations.audits.length === 0 ? <EmptyState text="No audit events found." /> : operations.audits.map((event) => (
                    <div key={event.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex justify-between gap-2"><span className="font-medium">{event.action}</span><span className="text-muted-foreground">{dateTime(event.createdAt)}</span></div>
                      <p className="text-muted-foreground">{event.entityType}{event.entityId ? ` · ${event.entityId.slice(-8)}` : ""}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Created {dateTime(driver.user?.createdAt ?? driver.createdAt)} · Updated {dateTime(driver.updatedAt)}
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
