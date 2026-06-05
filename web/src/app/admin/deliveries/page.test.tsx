import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AdminDeliveriesPage from "./page"
import { authedFetch } from "@/lib/auth"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

describe("AdminDeliveriesPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
  })

  it("loads live deliveries and refreshes after a status update", async () => {
    let deliveries = [
      {
        id: "delivery-1",
        orderId: null,
        senderId: "sender-1",
        driverId: "driver-1",
        pickupName: "Kabul Warehouse",
        pickupAddress: "Shahr-e Naw, Kabul",
        dropoffName: "Ariana Mall",
        dropoffAddress: "Wazir Akbar Khan, Kabul",
        packageType: "Documents",
        status: "REQUESTED",
        fee: 180,
        distance: 4.2,
        requestedAt: "2026-06-01T09:00:00.000Z",
        deliveredAt: null,
        createdAt: "2026-06-01T09:00:00.000Z",
        sender: { name: "Zahra Sender", phone: "+93000000011" },
        driver: { name: null, phone: "+93000000022" },
        vehicle: { plateNumber: "KBL-4242", type: "CAR" },
        order: null,
      },
    ]

    mockedAuthedFetch.mockImplementation(async (path, init) => {
      if (path === "/admin/deliveries?page=1&limit=25") {
        return createResponse({ items: deliveries, total: deliveries.length, page: 1, limit: 25 })
      }

      if (path === "/admin/deliveries/delivery-1/status" && init?.method === "PATCH") {
        deliveries = [{ ...deliveries[0], status: "ASSIGNED" }]
        return createResponse(deliveries[0])
      }

      throw new Error(`Unexpected request: ${path}`)
    })

    const user = userEvent.setup()

    render(<AdminDeliveriesPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/deliveries?page=1&limit=25")
    })

    expect(await screen.findByText("Kabul Warehouse")).toBeInTheDocument()
    expect(screen.getByText("Ariana Mall")).toBeInTheDocument()
    expect(screen.getByText("+93000000022 · KBL-4242")).toBeInTheDocument()
    expect(screen.getByText("180 AFN")).toBeInTheDocument()
    expect(screen.getAllByText("REQUESTED")).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: /assigned/i }))

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith(
        "/admin/deliveries/delivery-1/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "ASSIGNED" }),
        }),
      )
    })

    expect(await screen.findAllByText("ASSIGNED")).toHaveLength(2)
  })
})