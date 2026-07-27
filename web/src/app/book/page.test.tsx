import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import BookingPage from "./page"

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="mock-map">Mock PlacesBookingMap</div>,
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/book",
}))

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: "en", changeLanguage: async () => {} },
  }),
}))

// Mock auth utils
vi.mock("@/lib/auth", () => ({
  getStoredUser: () => ({ id: "user-123", name: "Noori User" }),
  canAccessWebPortal: () => true,
  getDefaultRouteForRole: () => "/dashboard",
  authedFetch: vi.fn().mockImplementation((url: string) => {
    if (url.includes("/places?limit=25")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    }
    if (url.includes("/places?q=")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: "1", name: "Kabul Airport", address: "Airport Rd, Kabul", lat: 34.56, lng: 69.21 },
            { id: "2", name: "Kabul University", address: "Jamal Mina, Kabul", lat: 34.51, lng: 69.13 },
            { id: "3", name: "Darulaman Palace", address: "Darulaman, Kabul", lat: 34.46, lng: 69.11 },
          ]),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  }),
}))

describe("BookingPage ARIA Combobox", () => {
  it("implements standard keyboard accessibility patterns, ARIA attributes, and keyboard cycling", async () => {
    const user = userEvent.setup()
    render(<BookingPage />)

    const pickupInput = screen.getByPlaceholderText("Pickup")

    // Initially suggestions should be closed
    expect(pickupInput).toHaveAttribute("role", "combobox")
    expect(pickupInput).toHaveAttribute("aria-autocomplete", "list")
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")

    // Type query to fetch suggestions
    await user.type(pickupInput, "Kab")

    // Wait for the debounced fetch of suggestions to complete and display
    const suggestions = await screen.findByRole("listbox", { name: "Pickup suggestions" })
    expect(suggestions).toBeInTheDocument()
    expect(pickupInput).toHaveAttribute("aria-expanded", "true")

    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(3)

    // Initially no item is active
    expect(pickupInput).not.toHaveAttribute("aria-activedescendant")
    expect(options[0]).toHaveAttribute("aria-selected", "false")

    // Press ArrowDown -> first option active
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-opt-0")
    expect(options[0]).toHaveAttribute("aria-selected", "true")
    expect(options[1]).toHaveAttribute("aria-selected", "false")

    // Press ArrowDown -> second option active
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-opt-1")
    expect(options[1]).toHaveAttribute("aria-selected", "true")

    // Press ArrowDown -> third option active
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-opt-2")
    expect(options[2]).toHaveAttribute("aria-selected", "true")

    // Press ArrowDown -> wrap-around to first option
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-opt-0")
    expect(options[0]).toHaveAttribute("aria-selected", "true")

    // Press ArrowUp -> loop-backwards to third option
    await user.keyboard("{ArrowUp}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-opt-2")
    expect(options[2]).toHaveAttribute("aria-selected", "true")

    // Press Enter to select the active option (Darulaman Palace)
    await user.keyboard("{Enter}")
    expect(pickupInput).toHaveValue("Darulaman Palace")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()

    // Test Escape to close
    await user.clear(pickupInput)
    await user.type(pickupInput, "Kab")
    const suggestions2 = await screen.findByRole("listbox", { name: "Pickup suggestions" })
    expect(suggestions2).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })
})
