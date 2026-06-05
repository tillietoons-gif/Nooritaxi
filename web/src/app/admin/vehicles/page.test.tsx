import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import VehiclesPage from "./page"
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

describe("VehiclesPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
  })

  it("loads live vehicle registry data and shows an honest empty inspections state", async () => {
    mockedAuthedFetch.mockImplementation(async (path) => {
      if (path === "/admin/vehicles") {
        return createResponse([
          {
            id: "vehicle-1",
            type: "CAR",
            make: "Toyota",
            model: "Corolla",
            plateNumber: "DRV-806818",
            color: "White",
            capacity: 4,
            isActive: true,
            status: "ACTIVE",
            driver: { user: { name: "Demo Driver", phone: "+93700010000" } },
            fleet: null,
          },
          {
            id: "vehicle-2",
            type: "CAR",
            make: "Honda",
            model: "Civic",
            plateNumber: "KBL-1001",
            color: "Black",
            capacity: 4,
            isActive: false,
            status: "MAINTENANCE",
            driver: { user: { name: "Farid Driver", phone: "+93700000002" } },
            fleet: { companyName: "Noori Fleet" },
          },
        ])
      }

      if (path === "/admin/vehicles/inspections") {
        return createResponse([])
      }

      throw new Error(`Unexpected request: ${path}`)
    })

    render(<VehiclesPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/vehicles")
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/vehicles/inspections")
    })

    expect(await screen.findByText("DRV-806818")).toBeInTheDocument()
    expect(screen.getByText("KBL-1001")).toBeInTheDocument()
    expect(screen.getByText("Demo Driver")).toBeInTheDocument()
    expect(screen.getByText("Farid Driver")).toBeInTheDocument()
    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
    expect(screen.getByText("MAINTENANCE")).toBeInTheDocument()
    expect(screen.getAllByText("2")).not.toHaveLength(0)
    expect(screen.getByText(/No inspection records have been logged yet/i)).toBeInTheDocument()
    expect(screen.getByText(/Vehicle creation and assignment are currently managed through driver onboarding flows/i)).toBeInTheDocument()
  })
})