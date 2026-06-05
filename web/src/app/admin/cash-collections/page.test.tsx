import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import CashCollectionsPage from "./page"
import { authedFetch } from "@/lib/auth"

vi.mock("@/components/auth-gate", () => ({
  AuthGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/layout/header", () => ({
  Header: () => <div>Header</div>,
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

const analytics = {
  outstandingReceivables: 124500,
  totalCashCollected: 850200,
}

const settlements = [
  {
    id: "settlement-pending",
    userId: "driver-1",
    fleetId: null,
    periodStart: "2026-05-01T00:00:00.000Z",
    periodEnd: "2026-05-07T00:00:00.000Z",
    totalEarned: 2400,
    platformFee: 240,
    cashCollected: 100,
    netBalance: -400,
    status: "PENDING",
    notes: null,
    user: { name: "Farid Driver", phone: "+93000000001" },
    fleet: null,
  },
]

const collections = [
  {
    id: "collection-1",
    settlementId: "settlement-pending",
    amount: 300,
    receiptNo: "RCPT-101",
    notes: "Collected at Kabul hub",
    collectedAt: "2026-06-01T10:00:00.000Z",
    admin: { name: "Finance Lead", phone: "+93000000099", email: "finance@noori.test" },
    settlement: settlements[0],
  },
]

describe("CashCollectionsPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
  })

  it("loads live cash collection data and records a new collection", async () => {
    let currentAnalytics = { ...analytics }
    let currentSettlements = [...settlements]
    let currentCollections = [...collections]

    mockedAuthedFetch.mockImplementation(async (path, init) => {
      if (path === "/admin/finance/analytics") return createResponse(currentAnalytics)
      if (path === "/admin/finance/settlements") return createResponse(currentSettlements)
      if (path === "/admin/finance/cash-collections?limit=100") return createResponse(currentCollections)
      if (path === "/admin/finance/collect-cash" && init?.method === "POST") {
        currentCollections = [
          {
            id: "collection-2",
            settlementId: "settlement-pending",
            amount: 400,
            receiptNo: "RCPT-202",
            notes: "Paid in full",
            collectedAt: "2026-06-02T10:00:00.000Z",
            admin: { name: "Finance Lead", phone: "+93000000099", email: "finance@noori.test" },
            settlement: { ...currentSettlements[0], cashCollected: 500, netBalance: 0, status: "COMPLETED" },
          },
          ...currentCollections,
        ]
        currentAnalytics = { ...currentAnalytics, outstandingReceivables: 0, totalCashCollected: 850600 }
        currentSettlements = [{ ...currentSettlements[0], cashCollected: 500, netBalance: 0, status: "COMPLETED" }]
        return createResponse({ id: "collection-2" })
      }
      throw new Error(`Unexpected request: ${path}`)
    })

    const user = userEvent.setup()

    render(<CashCollectionsPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenNthCalledWith(1, "/admin/finance/analytics")
      expect(mockedAuthedFetch).toHaveBeenNthCalledWith(2, "/admin/finance/settlements")
      expect(mockedAuthedFetch).toHaveBeenNthCalledWith(3, "/admin/finance/cash-collections?limit=100")
    })

    expect(await screen.findByText(/124,500 AFN/i)).toBeInTheDocument()
    expect(screen.getAllByText("Farid Driver")).toHaveLength(2)
    expect(screen.getByText(/Collected by Finance Lead/i)).toBeInTheDocument()
    expect(screen.getByText(/Receipt RCPT-101/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /record collection/i }))
    await user.clear(screen.getByLabelText(/collection amount/i))
    await user.type(screen.getByLabelText(/collection amount/i), "400")
    await user.type(screen.getByLabelText(/receipt number/i), "RCPT-202")
    await user.type(screen.getByLabelText(/collection notes/i), "Paid in full")
    await user.click(screen.getByRole("button", { name: /save collection/i }))

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith(
        "/admin/finance/collect-cash",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            settlementId: "settlement-pending",
            amount: 400,
            collectedFrom: "driver-1",
            receiptNo: "RCPT-202",
            notes: "Paid in full",
          }),
        }),
      )
    })

    expect(await screen.findByText(/850,600 AFN/i)).toBeInTheDocument()
    expect(screen.getByText(/Receipt RCPT-202/i)).toBeInTheDocument()
    expect(screen.getByText("Settled")).toBeInTheDocument()
  })
})
