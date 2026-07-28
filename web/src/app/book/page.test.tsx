import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import BookingPage from "./page"
import { authedFetch, getStoredUser } from "@/lib/auth"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>{children}</a>
  ),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/book",
}))

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="mock-map">Mock PlacesBookingMap</div>,
}))

vi.mock("@/components/layout/header", () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer data-testid="mock-footer">Footer</footer>,
}))

vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
  getStoredUser: vi.fn(),
}))

const mockUser = { id: "user-1", name: "Rider One", phone: "+93700000001", role: "RIDER" }
const mockPlaces = [
  { id: "place-1", name: "Kabul International Airport", address: "Kabul, Afghanistan", lat: 34.565, lng: 69.213 },
  { id: "place-2", name: "Darul Aman Palace", address: "Darulaman Rd, Kabul", lat: 34.465, lng: 69.119 },
]

describe("BookingPage Accessibility Combobox", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getStoredUser).mockReturnValue(mockUser)
    vi.mocked(authedFetch).mockImplementation((url) => {
      if (url.startsWith("/places?limit=25")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPlaces,
        } as Response)
      }
      if (url.includes("/places?q=")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPlaces,
        } as Response)
      }
      if (url.includes("/trips/estimate")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ fare: 350, currency: "AFN", distance: 10, surgeMultiplier: 1.0 }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response)
    })
  })

  it("renders correctly with proper initial accessibility role and combobox attributes", async () => {
    await act(async () => {
      render(<BookingPage />)
    })

    const pickupInput = screen.getByPlaceholderText("Pickup")
    expect(pickupInput).toHaveAttribute("role", "combobox")
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")
    expect(pickupInput).toHaveAttribute("aria-autocomplete", "list")
  })

  it("supports keyboard navigation loop-around cycling and Esc dismiss", async () => {
    const user = userEvent.setup()

    await act(async () => {
      render(<BookingPage />)
    })

    const pickupInput = screen.getByPlaceholderText("Pickup")

    // Type to trigger suggestions
    await user.type(pickupInput, "Kab")

    // Wait for the suggestions dropdown to appear
    await waitFor(() => {
      expect(screen.getByRole("listbox", { name: /pickup suggestions/i })).toBeInTheDocument()
    })

    expect(pickupInput).toHaveAttribute("aria-expanded", "true")

    // Arrow down to highlight first suggestion -> index 0 (Airport)
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-0")

    // Arrow down to highlight second suggestion -> index 1 (Darul Aman Palace)
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-1")

    // Arrow down to cycle / loop-around to the first suggestion -> index 0 (Airport)
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-0")

    // Arrow up to cycle / loop-around to the second suggestion -> index 1 (Darul Aman Palace)
    await user.keyboard("{ArrowUp}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-suggestion-1")

    // Select with Enter key
    await user.keyboard("{Enter}")
    expect(pickupInput).toHaveValue("Darul Aman Palace")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()

    // Test Escape to dismiss listbox
    await user.clear(pickupInput)
    await user.type(pickupInput, "Dar")
    await waitFor(() => {
      expect(screen.getByRole("listbox", { name: /pickup suggestions/i })).toBeInTheDocument()
    })

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })
})
