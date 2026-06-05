import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import RefundsPage from "./page"
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

describe("RefundsPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
  })

  it("loads live refund data, filters it, and processes a refund", async () => {
    let currentRefunds = [
      {
        id: "refund-1",
        tripId: "trip-101",
        orderId: null,
        deliveryId: null,
        amount: 150,
        reason: "Driver requested cash after wallet payment",
        status: "PENDING",
        createdAt: "2026-06-01T09:00:00.000Z",
        processedAt: null,
        user: { name: "Zahra S.", phone: "+93000000001" },
      },
      {
        id: "refund-2",
        tripId: null,
        orderId: null,
        deliveryId: "delivery-77",
        amount: 80,
        reason: "Delivery arrived too late",
        status: "APPROVED",
        createdAt: "2026-06-01T10:00:00.000Z",
        processedAt: "2026-06-01T11:00:00.000Z",
        user: { name: "Ahmad", phone: "+93000000002" },
      },
    ]

    mockedAuthedFetch.mockImplementation(async (path, init) => {
      if (path === "/admin/finance/refunds") {
        return createResponse(currentRefunds)
      }

      if (path === "/admin/finance/refunds?status=PENDING") {
        return createResponse(currentRefunds.filter((refund) => refund.status === "PENDING"))
      }

      if (path === "/admin/finance/refunds/refund-1" && init?.method === "PUT") {
        currentRefunds = currentRefunds.map((refund) =>
          refund.id === "refund-1"
            ? { ...refund, status: "APPROVED", processedAt: "2026-06-01T12:00:00.000Z" }
            : refund,
        )
        return createResponse({ id: "refund-1" })
      }

      throw new Error(`Unexpected request: ${path}`)
    })

    const user = userEvent.setup()

    render(<RefundsPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/finance/refunds")
    })

    expect(await screen.findAllByText(/150 AFN/i)).toHaveLength(2)
    expect(screen.getByText("Zahra S.")).toBeInTheDocument()
    expect(screen.getByText("Ahmad")).toBeInTheDocument()
    expect(screen.getAllByText("Trip")).toHaveLength(2)
    expect(screen.getAllByText("Delivery")).toHaveLength(2)

    await user.selectOptions(screen.getByLabelText(/status filter/i), "PENDING")

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/finance/refunds?status=PENDING")
    })

    expect(screen.getByText("Zahra S.")).toBeInTheDocument()
    expect(screen.queryByText("Ahmad")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /approve/i }))

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith(
        "/admin/finance/refunds/refund-1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ status: "APPROVED" }),
        }),
      )
    })

    await user.selectOptions(screen.getByLabelText(/status filter/i), "ALL")

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/finance/refunds")
    })

    expect(await screen.findByText(/^0 AFN$/i)).toBeInTheDocument()
    expect(screen.getAllByText("APPROVED")).toHaveLength(2)
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument()
  })
})