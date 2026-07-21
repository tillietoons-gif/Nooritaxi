import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import BookingPage from "./page"
import { authedFetch, getStoredUser } from "@/lib/auth"

vi.mock("@/components/layout/header", () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}))

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <div data-testid="mock-footer">Footer</div>,
}))

vi.mock("@/components/booking/PlacesBookingMap", () => ({
  default: () => <div data-testid="mock-map">Mock Map</div>,
}))

vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
  getStoredUser: vi.fn(),
}))

const mockedAuthedFetch = vi.mocked(authedFetch)
const mockedGetStoredUser = vi.mocked(getStoredUser)

function createResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

describe("BookingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedAuthedFetch.mockReset()
    mockedGetStoredUser.mockReset()

    // Mock stored user
    mockedGetStoredUser.mockReturnValue({
      id: "user-123",
      name: "Ahmad",
      phone: "+93700000000",
      role: "RIDER",
    })

    // Default place fetching mock
    mockedAuthedFetch.mockImplementation(async (url) => {
      if (url.includes("/places?limit=25")) {
        return createResponse([
          { id: "place-1", name: "Kabul University", address: "Jamal Mina", lat: 34.516, lng: 69.15 },
        ])
      }
      if (url.includes("/places?q=")) {
        return createResponse([
          { id: "sug-1", name: "Shar-e Naw Park", address: "Kabul Center", lat: 34.53, lng: 69.17 },
          { id: "sug-2", name: "Darulaman Palace", address: "Darulaman Road", lat: 34.46, lng: 69.11 },
        ])
      }
      return createResponse([])
    })
  })

  it("implements ARIA combobox pattern on the pickup input", async () => {
    render(<BookingPage />)

    const pickupInput = screen.getByLabelText("Pickup Location")
    expect(pickupInput).toHaveAttribute("role", "combobox")
    expect(pickupInput).toHaveAttribute("aria-autocomplete", "list")
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")

    // Type to get suggestions
    fireEvent.change(pickupInput, { target: { value: "Sha" } })

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith(expect.stringContaining("/places?q=Sha"))
    })

    await waitFor(() => {
      expect(pickupInput).toHaveAttribute("aria-expanded", "true")
    })

    const suggestionsList = screen.getByRole("listbox", { name: "Pickup suggestions" })
    expect(suggestionsList).toBeInTheDocument()

    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveAttribute("tabIndex", "-1")
    expect(options[1]).toHaveAttribute("tabIndex", "-1")
  })

  it("supports keyboard navigation loop-around cycling, Escape to close, and Enter to select on pickup suggestions", async () => {
    render(<BookingPage />)

    const pickupInput = screen.getByLabelText("Pickup Location")
    fireEvent.change(pickupInput, { target: { value: "Sha" } })

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(2)
    })

    // Default active descendant should not be set yet
    expect(pickupInput).not.toHaveAttribute("aria-activedescendant")

    // Press ArrowDown to select first suggestion
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-0")
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true")

    // Press ArrowDown again to select second suggestion
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-1")
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true")

    // Press ArrowDown again to cycle/loop back to first suggestion
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-0")

    // Press ArrowUp to loop back to the last suggestion (wrap-around)
    fireEvent.keyDown(pickupInput, { key: "ArrowUp" })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-1")

    // Press Escape to clear suggestions
    fireEvent.keyDown(pickupInput, { key: "Escape" })
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")

    // Re-type with a different value and press Enter to select
    fireEvent.change(pickupInput, { target: { value: "Shar" } })
    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(2)
    })

    // Navigate to first option and select with Enter
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    fireEvent.keyDown(pickupInput, { key: "Enter" })

    await waitFor(() => {
      expect(pickupInput).toHaveValue("Shar-e Naw Park")
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })
})
