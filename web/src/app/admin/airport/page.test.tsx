import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AirportDashboardPage from "./page"
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

describe("AirportDashboardPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
  })

  it("loads live airport operations data for the selected airport", async () => {
    mockedAuthedFetch.mockImplementation(async (path) => {
      if (path === "/admin/airports") {
        return createResponse([
          {
            id: "airport-1",
            name: "Kabul International",
            iataCode: "KBL",
            zones: [
              { id: "zone-1", name: "Terminal 1", type: "PICKUP" },
              { id: "zone-2", name: "Terminal 2", type: "VIP" },
            ],
          },
        ])
      }

      if (path === "/admin/airports/airport-1/analytics") {
        return createResponse({
          driversInQueue: 3,
          assignedToday: 8,
          upcomingFlightsNext2Hours: 2,
          averageWaitTimeMins: 11,
        })
      }

      if (path === "/admin/airports/airport-1/queue") {
        return createResponse([
          {
            id: "queue-1",
            entryTime: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
            zone: { name: "Terminal 1", type: "PICKUP" },
            driver: { user: { name: "Farid Driver", phone: "+93700010000" } },
            vehicle: { plateNumber: "KBL-4242", make: "Toyota", model: "Corolla" },
          },
        ])
      }

      if (path === "/admin/airports/airport-1/flights") {
        return createResponse([
          {
            id: "flight-1",
            flightNumber: "FG302",
            airline: "Ariana Afghan",
            arrivalTime: "2026-06-05T14:30:00.000Z",
            status: "ON_TIME",
          },
        ])
      }

      throw new Error(`Unexpected request: ${path}`)
    })

    render(<AirportDashboardPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/airports")
    })

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/airports/airport-1/analytics")
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/airports/airport-1/queue")
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/airports/airport-1/flights")
    })

    expect(await screen.findByText("3")).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Kabul International (KBL)" })).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("11m")).toBeInTheDocument()
    expect(screen.getByText("Farid Driver")).toBeInTheDocument()
    expect(screen.getByText("Terminal 1 • KBL-4242")).toBeInTheDocument()
    expect(screen.getByText("FG302 - Ariana Afghan")).toBeInTheDocument()
  })

  it("renders an honest empty state when no airports exist", async () => {
    mockedAuthedFetch.mockResolvedValue(createResponse([]))

    render(<AirportDashboardPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/airports")
    })

    expect(await screen.findByText("No airport operations configured")).toBeInTheDocument()
    expect(screen.getByText(/does not have any airport records yet/i)).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeDisabled()
  })
})