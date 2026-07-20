import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import BookingPage from "./page"
import { authedFetch } from "@/lib/auth"

vi.mock("@/components/layout/header", () => ({
  Header: () => <header>Header</header>,
}))

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer>Footer</footer>,
}))

vi.mock("@/components/booking/PlacesBookingMap", () => ({
  default: () => <div data-testid="mock-map">Mock Map</div>,
}))

vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
  getStoredUser: vi.fn(() => ({ id: "user-1", name: "Test User", role: "CUSTOMER" })),
}))

const mockedAuthedFetch = vi.mocked(authedFetch)

function createResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

describe("BookingPage Accessibility & Keyboard Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedAuthedFetch.mockReset()
  })

  it("handles keyboard navigation and ARIA attributes for pickup suggestions", async () => {
    const mockPlaces = [
      { id: "place-1", name: "Kabul Zoo", address: "Kabul, Afghanistan", lat: 34.51, lng: 69.15 },
      { id: "place-2", name: "Babur Gardens", address: "Kabul, Afghanistan", lat: 34.50, lng: 69.16 },
    ]

    mockedAuthedFetch.mockImplementation(async (path) => {
      if (path.startsWith("/places?limit=25")) {
        return createResponse([])
      }
      if (path.startsWith("/places?q=kab")) {
        return createResponse(mockPlaces)
      }
      return createResponse([])
    })

    const user = userEvent.setup()
    render(<BookingPage />)

    const pickupInput = screen.getByLabelText(/pickup location/i)
    expect(pickupInput).toHaveAttribute("role", "combobox")
    expect(pickupInput).toHaveAttribute("aria-autocomplete", "list")
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")

    // Type "kab" to trigger suggestions
    await user.type(pickupInput, "kab")

    // Wait for the query debounce and fetch to resolve
    let suggestion1: HTMLElement | null = null
    await waitFor(() => {
      suggestion1 = screen.getByText("Kabul Zoo")
      expect(suggestion1).toBeInTheDocument()
    })

    expect(pickupInput).toHaveAttribute("aria-expanded", "true")
    expect(pickupInput).toHaveAttribute("aria-controls", "pickup-listbox")

    const listbox = screen.getByRole("listbox", { name: /pickup suggestions/i })
    expect(listbox).toBeInTheDocument()

    // Suggestions should have tabIndex={-1}
    const option1 = screen.getByRole("option", { name: /kabul zoo/i })
    const option2 = screen.getByRole("option", { name: /babur gardens/i })
    expect(option1).toHaveAttribute("tabIndex", "-1")
    expect(option2).toHaveAttribute("tabIndex", "-1")

    // Press ArrowDown to highlight first suggestion
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-item-0")
    expect(option1).toHaveAttribute("aria-selected", "true")
    expect(option2).toHaveAttribute("aria-selected", "false")

    // Press ArrowDown again to highlight second suggestion
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-item-1")
    expect(option1).toHaveAttribute("aria-selected", "false")
    expect(option2).toHaveAttribute("aria-selected", "true")

    // Press ArrowDown again to wrap around back to the first suggestion
    await user.keyboard("{ArrowDown}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-item-0")
    expect(option1).toHaveAttribute("aria-selected", "true")
    expect(option2).toHaveAttribute("aria-selected", "false")

    // Press ArrowUp to wrap back around to the second suggestion (last item)
    await user.keyboard("{ArrowUp}")
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-item-1")
    expect(option1).toHaveAttribute("aria-selected", "false")
    expect(option2).toHaveAttribute("aria-selected", "true")

    // Press Enter to select the second suggestion ("Babur Gardens")
    await user.keyboard("{Enter}")

    // Input value should be updated to "Babur Gardens" and suggestions should be closed
    expect(pickupInput).toHaveValue("Babur Gardens")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")
  })

  it("closes suggestions when pressing Escape", async () => {
    const mockPlaces = [
      { id: "place-1", name: "Kabul Zoo", address: "Kabul, Afghanistan", lat: 34.51, lng: 69.15 },
    ]

    mockedAuthedFetch.mockImplementation(async (path) => {
      if (path.startsWith("/places?limit=25")) {
        return createResponse([])
      }
      if (path.startsWith("/places?q=kab")) {
        return createResponse(mockPlaces)
      }
      return createResponse([])
    })

    const user = userEvent.setup()
    render(<BookingPage />)

    const pickupInput = screen.getByLabelText(/pickup location/i)

    await user.type(pickupInput, "kab")

    await waitFor(() => {
      expect(screen.getByText("Kabul Zoo")).toBeInTheDocument()
    })

    expect(pickupInput).toHaveAttribute("aria-expanded", "true")

    // Press Escape
    await user.keyboard("{Escape}")

    // Suggestions listbox should close
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")
  })
})
