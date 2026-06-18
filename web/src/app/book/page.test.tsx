import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import BookingPage from "./page"
import { authedFetch } from "@/lib/auth"

vi.mock("@/components/layout/header", () => ({
  Header: () => <div>Header</div>,
}))

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <div>Footer</div>,
}))

vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
  getStoredUser: () => ({ id: "user-123", name: "John Doe", role: "RIDER" }),
}))

const mockedAuthedFetch = vi.mocked(authedFetch)

describe("BookingPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
    // Initial fetch for places
    mockedAuthedFetch.mockImplementation(async (path) => {
        if (path === "/places?limit=25") {
            return { ok: true, json: async () => [] } as Response
        }
        return { ok: true, json: async () => [] } as Response
    })
  })

  it("renders the booking page correctly", () => {
    render(<BookingPage />)
    expect(screen.getByText("Book a Ride")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Pickup")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Destination")).toBeInTheDocument()
  })

  it("shows suggestions when typing in pickup and supports keyboard navigation", async () => {
    const places = [
      { id: "1", name: "Kabul University", address: "Kabul, Afghanistan", lat: 34.5, lng: 69.1 },
      { id: "2", name: "Kabul Airport", address: "Kabul, Afghanistan", lat: 34.6, lng: 69.2 },
    ]

    mockedAuthedFetch.mockImplementation(async (path) => {
      if (path.includes("/places?q=Kabul")) {
        return { ok: true, json: async () => places } as Response
      }
      return { ok: true, json: async () => [] } as Response
    })

    render(<BookingPage />)

    const pickupInput = screen.getByPlaceholderText("Pickup")
    fireEvent.change(pickupInput, { target: { value: "Kabul" } })

    // Wait for debounce and suggestions
    await waitFor(() => {
      expect(screen.getByText("Kabul University")).toBeInTheDocument()
    })

    // Keyboard navigation: ArrowDown
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    const firstOption = screen.getByText("Kabul University").closest("button")
    expect(firstOption).toHaveAttribute("aria-selected", "true")

    // Keyboard navigation: ArrowDown again
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    const secondOption = screen.getByText("Kabul Airport").closest("button")
    expect(secondOption).toHaveAttribute("aria-selected", "true")
    expect(firstOption).toHaveAttribute("aria-selected", "false")

    // Keyboard navigation: Enter
    fireEvent.keyDown(pickupInput, { key: "Enter" })
    expect(pickupInput).toHaveValue("Kabul Airport")
    expect(screen.queryByText("Kabul University")).not.toBeInTheDocument()
  })

  it("shows loading state on confirmation button", async () => {
     mockedAuthedFetch.mockImplementation(async (path) => {
        if (path === "/trips") {
            // Delay to catch loading state
            await new Promise(r => setTimeout(r, 100))
            return { ok: true, json: async () => ({ id: "trip-1", safetyCode: "1234", fare: 500 }) } as Response
        }
        return { ok: true, json: async () => [] } as Response
    })

    render(<BookingPage />)

    fireEvent.change(screen.getByPlaceholderText("Pickup"), { target: { value: "A" } })
    fireEvent.change(screen.getByPlaceholderText("Destination"), { target: { value: "B" } })

    const confirmButton = screen.getByRole("button", { name: /Confirm Booking/i })
    fireEvent.click(confirmButton)

    expect(screen.getByText(/Confirming.../i)).toBeInTheDocument()

    await waitFor(() => {
        expect(screen.getByText(/Ride requested/i)).toBeInTheDocument()
    })
  })
})
