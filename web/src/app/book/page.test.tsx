import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import BookingPage from "./page"
import { authedFetch } from "@/lib/auth"

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
  getStoredUser: vi.fn(() => ({ id: "user-1", name: "Test User" })),
}))

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="mock-map">Mock Map</div>,
}))

vi.mock("@/components/layout/header", () => ({
  Header: () => <header>Header</header>,
}))

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer>Footer</footer>,
}))

describe("BookingPage Accessibility & Keyboard Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for initial places fetch
    ;(authedFetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    })
  })

  it("updates suggestions and handles keyboard navigation for pickup input", async () => {
    const suggestions = [
      { id: "1", name: "Kabul Airport", address: "Airport Road", lat: 34.5, lng: 69.2 },
      { id: "2", name: "Kabul City Center", address: "Shar-e-Naw", lat: 34.51, lng: 69.18 },
    ]

    ;(authedFetch as any).mockImplementation((url: string) => {
      if (url.includes("/places?q=Kab")) {
        return Promise.resolve({
          ok: true,
          json: async () => suggestions,
        })
      }
      return Promise.resolve({ ok: true, json: async () => [] })
    })

    render(<BookingPage />)

    const pickupInput = screen.getByPlaceholderText("Pickup")

    // Type to trigger suggestions
    fireEvent.change(pickupInput, { target: { value: "Kab" } })

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText("Kabul Airport")).toBeInTheDocument()
    })

    const listbox = screen.getByRole("listbox")
    expect(listbox).toBeInTheDocument()
    expect(pickupInput).toHaveAttribute("aria-expanded", "true")

    // ArrowDown to first suggestion
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    const option1 = screen.getByRole("option", { name: /Kabul Airport/i })
    expect(option1).toHaveAttribute("aria-selected", "true")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-option-0")

    // ArrowDown to second suggestion
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    const option2 = screen.getByRole("option", { name: /Kabul City Center/i })
    expect(option2).toHaveAttribute("aria-selected", "true")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-option-1")

    // ArrowUp back to first suggestion
    fireEvent.keyDown(pickupInput, { key: "ArrowUp" })
    expect(option1).toHaveAttribute("aria-selected", "true")

    // ArrowUp again should wrap to the last suggestion
    fireEvent.keyDown(pickupInput, { key: "ArrowUp" })
    expect(option2).toHaveAttribute("aria-selected", "true")

    // Enter to select
    fireEvent.keyDown(pickupInput, { key: "Enter" })

    // Suggestions should be gone and input updated
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
      expect(pickupInput).toHaveValue("Kabul City Center")
    })
  })

  it("closes suggestions on Escape", async () => {
    const suggestions = [
      { id: "1", name: "Kabul Airport", address: "Airport Road", lat: 34.5, lng: 69.2 },
    ]

    ;(authedFetch as any).mockImplementation((url: string) => {
      if (url.includes("/places?q=Kab")) {
        return Promise.resolve({
          ok: true,
          json: async () => suggestions,
        })
      }
      return Promise.resolve({ ok: true, json: async () => [] })
    })

    render(<BookingPage />)

    const pickupInput = screen.getByPlaceholderText("Pickup")
    fireEvent.change(pickupInput, { target: { value: "Kab" } })

    await waitFor(() => {
      expect(screen.getByText("Kabul Airport")).toBeInTheDocument()
    })

    fireEvent.keyDown(pickupInput, { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })
})
