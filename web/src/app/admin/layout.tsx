import { AuthGate } from "@/components/auth-gate"
import { AdminShellHeader } from "@/components/admin/admin-shell-header"
import { PatternOverlay } from "@/components/ui/pattern-overlay"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <div className="flex flex-col min-h-screen bg-background/50 relative">
        {/* Background Pattern */}
        <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
          <PatternOverlay />
        </div>

        <div className="relative z-10 flex-1">
          <AdminShellHeader />
          {children}
        </div>
      </div>
    </AuthGate>
  )
}
