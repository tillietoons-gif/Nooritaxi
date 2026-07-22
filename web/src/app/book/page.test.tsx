import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import BookingPage from "./page"
import { authedFetch, getStoredUser } from "@/lib/auth"

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockMap() {
      return <div data-testid="places-booking-map">Mock Map</div>
    }
  }
}))

vi.mock("@/components/layout/header", () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}))

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <div data-testid="mock-footer">Footer</div>,
}))

vi.mock("lucide-react", () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />
  return {
    MapPin: Icon,
    Navigation: Icon,
    Shield: Icon,
    Clock: Icon,
    Car: Icon,
  }
})

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("BookingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetStoredUser.mockReturnValue({
      id: "user-123",
      phone: "+93700123456",
      role: "CUSTOMER",
      name: "Test Customer"
    })
    // Mock /places fetch on load
    mockedAuthedFetch.mockImplementation(async (path) => {
      if (path === "/places?limit=25") {
        return createResponse([])
      }
      return createResponse([])
    })
  })

  it("renders pickup and destination inputs with correct roles and attributes", async () => {
    await act(async () => {
      render(<BookingPage />)
    })

    const pickupInput = screen.getByLabelText("Pickup Location")
    const destinationInput = screen.getByLabelText("Destination Location")

    expect(pickupInput).toHaveAttribute("role", "combobox")
    expect(pickupInput).toHaveAttribute("aria-autocomplete", "list")
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")

    expect(destinationInput).toHaveAttribute("role", "combobox")
    expect(destinationInput).toHaveAttribute("aria-autocomplete", "list")
    expect(destinationInput).toHaveAttribute("aria-expanded", "false")
  })

  it("handles keyboard navigation cycling, ARIA attributes, selection with Enter, and dismiss state with Escape", async () => {
    const mockSuggestions = [
      { id: "place-1", name: "Kabul Airport", address: "Kabul, Afghanistan", lat: 34.5, lng: 69.1 },
      { id: "place-2", name: "Kabul Hotel", address: "Hotel Area, Kabul", lat: 34.6, lng: 69.2 }
    ]

    mockedAuthedFetch.mockImplementation(async (path) => {
      if (path.startsWith("/places?q=")) {
        return createResponse(mockSuggestions)
      }
      return createResponse([])
    })

    await act(async () => {
      render(<BookingPage />)
    })

    const pickupInput = screen.getByLabelText("Pickup Location")

    // Type query to fetch suggestions
    await act(async () => {
      fireEvent.change(pickupInput, { target: { value: "Kab" } })
    })

    // Wait for debounce timeout (250ms)
    await act(async () => {
      await delay(350)
    })

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/places?q=Kab&limit=6")
    })

    // Wait for the option to be rendered
    const option1 = await screen.findByText("Kabul Airport")
    expect(option1).toBeInTheDocument()
    expect(screen.getByText("Kabul Hotel")).toBeInTheDocument()

    expect(pickupInput).toHaveAttribute("aria-expanded", "true")
    expect(pickupInput).toHaveAttribute("aria-controls", "pickup-suggestions")

    // Initially active index is -1 (no selection)
    expect(pickupInput).not.toHaveAttribute("aria-activedescendant")

    // ArrowDown should move focus to first item (index 0)
    await act(async () => {
      fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-option-0")
    expect(screen.getByRole("option", { name: /Kabul Airport/i })).toHaveAttribute("aria-selected", "true")

    // ArrowDown again should move to second item (index 1)
    await act(async () => {
      fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-option-1")
    expect(screen.getByRole("option", { name: /Kabul Hotel/i })).toHaveAttribute("aria-selected", "true")

    // ArrowDown again should loop back to first item (index 0)
    await act(async () => {
      fireEvent.keyDown(pickupInput, { key: "ArrowDown" })
    })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-option-0")

    // ArrowUp should cycle backwards and wrap around to last item (index 1)
    await act(async () => {
      fireEvent.keyDown(pickupInput, { key: "ArrowUp" })
    })
    expect(pickupInput).toHaveAttribute("aria-activedescendant", "pickup-option-1")

    // Press Enter to select the active suggestion
    await act(async () => {
      fireEvent.keyDown(pickupInput, { key: "Enter" })
    })

    // Suggestion should be selected and search value updated
    expect(pickupInput).toHaveValue("Kabul Hotel")
    expect(screen.queryByText("Kabul Airport")).not.toBeInTheDocument()
    expect(pickupInput).toHaveAttribute("aria-expanded", "false")

    // Open suggestions again for Destination
    const destinationInput = screen.getByLabelText("Destination Location")
    await act(async () => {
      fireEvent.change(destinationInput, { target: { value: "Hot" } })
    })

    await act(async () => {
      await delay(350)
    })

    const destOption = await screen.findByText("Kabul Airport")
    expect(destOption).toBeInTheDocument()
    expect(destinationInput).toHaveAttribute("aria-expanded", "true")

    // Press Escape to dismiss/close the suggestion list
    await act(async () => {
      fireEvent.keyDown(destinationInput, { key: "Escape" })
    })
    expect(screen.queryByText("Kabul Airport")).not.toBeInTheDocument()
    expect(destinationInput).toHaveAttribute("aria-expanded", "false")
  })
})
