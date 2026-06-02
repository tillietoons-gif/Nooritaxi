"use client"

import { AuthGate } from "@/components/auth-gate"
import { Header } from "@/components/layout/header"
import { HeadingLg, BodyMd } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, FileText, PieChart, Briefcase, FileSignature, Wallet, Headset } from "lucide-react"
import Link from "next/link"

export default function CorporateDashboardPage() {
  const modules = [
    { label: "Corporate Accounts", icon: Building2, href: "/admin/corporate/accounts", desc: "Manage registered B2B clients" },
    { label: "Employees & Departments", icon: Users, href: "/admin/corporate/employees", desc: "Staff lists and role management" },
    { label: "Budgets & Cost Centers", icon: PieChart, href: "/admin/corporate/budgets", desc: "Spending limits and tracking" },
    { label: "Travel Policies", icon: Briefcase, href: "/admin/corporate/policies", desc: "Ride rules and restrictions" },
    { label: "Billing & Invoices", icon: Wallet, href: "/admin/corporate/invoices", desc: "Monthly settlements & taxes" },
    { label: "Contracts & SLAs", icon: FileSignature, href: "/admin/corporate/contracts", desc: "Agreements and discounts" },
    { label: "Corporate Reports", icon: FileText, href: "/admin/corporate/reports", desc: "Analytics & exportable data" },
    { label: "B2B Support Hub", icon: Headset, href: "/admin/corporate/support", desc: "Dedicated priority support" },
  ]

  return (
    <AuthGate roles={["ADMIN"]}>
      <div className="flex flex-col min-h-screen bg-background/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <HeadingLg className="mb-2 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Corporate Accounts & B2B Travel
            </HeadingLg>
            <BodyMd className="text-muted-foreground">
              Enterprise management portal for company accounts, budgets, policies, and billing.
            </BodyMd>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-premium border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">24</h3>
                    <p className="text-xs text-muted-foreground">Active Corporations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">1,842</h3>
                    <p className="text-xs text-muted-foreground">Enrolled Employees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">450K AFN</h3>
                    <p className="text-xs text-muted-foreground">B2B Revenue (MTD)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-premium border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">4,502</h3>
                    <p className="text-xs text-muted-foreground">Completed B2B Trips</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((mod, i) => (
              <Link href={mod.href} key={i}>
                <Card className="glass-premium hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-base">
                      <div className="p-2 bg-muted rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                        <mod.icon className="h-5 w-5" />
                      </div>
                      {mod.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{mod.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </AuthGate>
  )
}
