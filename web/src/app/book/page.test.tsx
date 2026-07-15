import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import BookingPage from "./page"
import { authedFetch } from "@/lib/auth"

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
  getStoredUser: vi.fn(() => ({ id: "user-1", name: "Test User" })),
  getDefaultRouteForRole: vi.fn(() => "/dashboard"),
  clearSession: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: "en",
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => "/book"),
}))

// Mock dynamic component
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="mock-map">Mock Map</div>,
}))

describe("BookingPage Keyboard Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for initial places fetch
    ;(authedFetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
  })

  it("navigates through pickup suggestions using ArrowDown and ArrowUp", async () => {
    const user = userEvent.setup()
    const suggestions = [
      { id: "1", name: "Place A", address: "Address A", lat: 10, lng: 20 },
      { id: "2", name: "Place B", address: "Address B", lat: 11, lng: 21 },
    ]

    // Mock suggestions fetch
    ;(authedFetch as any).mockImplementation((url: string) => {
      if (url.includes("/places?q=")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(suggestions),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    render(<BookingPage />)

    const pickupInput = screen.getByPlaceholderText("Pickup")
    await user.type(pickupInput, "Place")

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText("Place A")).toBeInTheDocument()
    })

    const listbox = screen.getByRole("listbox", { name: "" }) // pickup-listbox doesn't have a label but has role
    expect(listbox).toBeInTheDocument()

    // Press ArrowDown
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    const optionA = screen.getByRole("option", { name: /Place A/i })
    expect(optionA).toHaveAttribute("aria-selected", "true")
    expect(optionA).toHaveClass("bg-primary/10")

    // Press ArrowDown again
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    const optionB = screen.getByRole("option", { name: /Place B/i })
    expect(optionB).toHaveAttribute("aria-selected", "true")
    expect(optionB).toHaveClass("bg-primary/10")
    expect(optionA).toHaveAttribute("aria-selected", "false")

    // Press ArrowUp
    fireEvent.keyDown(pickupInput, { key: "ArrowUp" })
    expect(optionA).toHaveAttribute("aria-selected", "true")
  })

  it("selects a suggestion using Enter", async () => {
    const user = userEvent.setup()
    const suggestions = [
      { id: "1", name: "Target Place", address: "Target Address", lat: 10, lng: 20 },
    ]

    ;(authedFetch as any).mockImplementation((url: string) => {
      if (url.includes("/places?q=")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(suggestions),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    render(<BookingPage />)

    const pickupInput = screen.getByPlaceholderText("Pickup")
    await user.type(pickupInput, "Target")

    await waitFor(() => {
      expect(screen.getByText("Target Place")).toBeInTheDocument()
    })

    // Highlight then select
    fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    fireEvent.keyDown(pickupInput, { key: "Enter" })

    // Suggestions should be gone and value updated
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
      expect(pickupInput).toHaveValue("Target Place")
    })
  })

  it("closes suggestions on Escape", async () => {
    const user = userEvent.setup()
    ;(authedFetch as any).mockImplementation((url: string) => {
      if (url.includes("/places?q=")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: "1", name: "A", address: "B", lat: 1, lng: 1 }]),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    render(<BookingPage />)
    const pickupInput = screen.getByPlaceholderText("Pickup")
    await user.type(pickupInput, "Test")

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })

    fireEvent.keyDown(pickupInput, { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })
})
