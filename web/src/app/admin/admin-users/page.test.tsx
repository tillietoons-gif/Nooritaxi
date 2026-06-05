import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AdminUsersPage from "./page"
import { authedFetch } from "@/lib/auth"

vi.mock("@/components/auth-gate", () => ({
  AuthGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/layout/header", () => ({
  Header: () => <div>Header</div>,
}))

vi.mock("@/lib/auth", () => ({
  apiUrl: "http://localhost:3001/api",
  authedFetch: vi.fn(),
}))

const mockedAuthedFetch = vi.mocked(authedFetch)

function createResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

const roles = [
  {
    id: "role-super",
    name: "Super Admin",
    isSystem: true,
    description: "Full access",
  },
  {
    id: "role-finance",
    name: "Finance Admin",
    isSystem: true,
    description: "Finance access",
  },
]

const adminUsers = {
  items: [
    {
      id: "admin-1",
      name: "Noori Admin",
      phone: "+93000000000",
      email: "admin@noori.test",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: "2026-06-01T00:00:00.000Z",
      adminRoles: [
        {
          cityScope: null,
          role: roles[0],
        },
      ],
    },
    {
      id: "admin-2",
      name: "Finance Lead",
      phone: "+93000000001",
      email: "finance@noori.test",
      role: "ADMIN",
      status: "SUSPENDED",
      createdAt: "2026-06-02T00:00:00.000Z",
      adminRoles: [
        {
          cityScope: "Kabul",
          role: roles[1],
        },
      ],
    },
  ],
  total: 2,
  page: 1,
  limit: 100,
}

const searchedUsers = {
  items: [adminUsers.items[1]],
  total: 1,
  page: 1,
  limit: 100,
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("loads live admin users and applies backend search with RBAC role filtering", async () => {
    mockedAuthedFetch
      .mockResolvedValueOnce(createResponse(roles))
      .mockResolvedValueOnce(createResponse(adminUsers))
      .mockResolvedValueOnce(createResponse(searchedUsers))

    const user = userEvent.setup()

    render(<AdminUsersPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenNthCalledWith(1, "/admin/roles")
      expect(mockedAuthedFetch).toHaveBeenNthCalledWith(2, "/admin/users?role=ADMIN&limit=100")
    })

    expect(await screen.findByText("Showing 2 admin accounts")).toBeInTheDocument()
    expect(screen.getByText("Noori Admin")).toBeInTheDocument()
    expect(screen.getByText("Finance Lead")).toBeInTheDocument()

    await user.type(screen.getByLabelText(/search admins/i), "finance")

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenLastCalledWith("/admin/users?role=ADMIN&limit=100&q=finance")
    })

    expect(await screen.findByText("Showing 1 of 1 matching admin accounts")).toBeInTheDocument()
    expect(screen.getByText("Finance Lead")).toBeInTheDocument()
    expect(screen.queryByText("Noori Admin")).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/rbac role/i), "role-super")

    expect(screen.getByText("No admins match the current filters")).toBeInTheDocument()
  })
})