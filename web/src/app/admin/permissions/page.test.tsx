import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import PermissionsMatrixPage from "./page"
import { authedFetch } from "@/lib/auth"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

vi.mock("@/components/auth-gate", () => ({
  AuthGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
}))

const mockedAuthedFetch = vi.mocked(authedFetch)

function createResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

const permissions = [
  {
    id: "perm-users-view",
    name: "users.view",
    module: "users",
    action: "view",
    description: "View riders and users",
  },
  {
    id: "perm-wallets-view",
    name: "wallets.view",
    module: "wallets",
    action: "view",
    description: "View user and driver wallets",
  },
  {
    id: "perm-reports-export",
    name: "reports.export",
    module: "reports",
    action: "export",
    description: "Export analytics data",
  },
  {
    id: "perm-support-reply",
    name: "support.reply",
    module: "support",
    action: "reply",
    description: "Reply to support tickets",
  },
]

const roles = [
  {
    id: "role-support",
    name: "Support Admin",
    description: "Support coverage",
    isSystem: true,
    permissions: [
      { permission: permissions[0] },
      { permission: permissions[3] },
    ],
    _count: { admins: 1 },
  },
  {
    id: "role-audit",
    name: "Audit Ops",
    description: "Custom audit role",
    isSystem: false,
    permissions: [
      { permission: permissions[1] },
      { permission: permissions[2] },
    ],
    _count: { admins: 0 },
  },
]

describe("PermissionsMatrixPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
  })

  it("loads live RBAC data and filters the matrix by search, module, and role", async () => {
    mockedAuthedFetch.mockResolvedValueOnce(createResponse(roles)).mockResolvedValueOnce(createResponse(permissions))

    const user = userEvent.setup()

    render(<PermissionsMatrixPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenNthCalledWith(1, "/admin/roles")
      expect(mockedAuthedFetch).toHaveBeenNthCalledWith(2, "/admin/roles/permissions")
    })

    expect(await screen.findByRole("columnheader", { name: /audit ops/i })).toBeInTheDocument()
    expect(screen.getByText("reports.export")).toBeInTheDocument()
    expect(screen.getByText("Mapped 4 permissions across 2 roles")).toBeInTheDocument()

    await user.type(screen.getByLabelText(/search permissions/i), "wallet")

    expect(screen.getByText("wallets.view")).toBeInTheDocument()
    expect(screen.queryByText("users.view")).not.toBeInTheDocument()
    expect(screen.getByText("1 matching permissions")).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/search permissions/i))
    await user.selectOptions(screen.getByLabelText(/module/i), "reports")

    expect(screen.getByText("reports.export")).toBeInTheDocument()
    expect(screen.queryByText("wallets.view")).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/role focus/i), "role-audit")

    expect(screen.getByRole("columnheader", { name: /audit ops/i })).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: /support admin/i })).not.toBeInTheDocument()
    expect(screen.getByText("1 visible roles")).toBeInTheDocument()
  })
})