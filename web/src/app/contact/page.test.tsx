import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ContactPage from "./page"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/contact",
}))

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
}))

// Mock components that might cause issues in JSdom
vi.mock("@/components/layout/header", () => ({
  Header: () => <header>Header</header>,
}))
vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer>Footer</footer>,
}))
vi.mock("@/components/ui/pattern-overlay", () => ({
  PatternOverlay: () => <div>PatternOverlay</div>,
}))

describe("ContactPage", () => {
  it("renders the contact form initially", () => {
    render(<ContactPage />)

    expect(screen.getByLabelText(/Identity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Communication Node/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Transmission/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Send Message/i })).toBeInTheDocument()
  })

  it("shows loading state and then success message on submission", async () => {
    render(<ContactPage />)

    const nameInput = screen.getByLabelText(/Identity/i)
    const emailInput = screen.getByLabelText(/Communication Node/i)
    const messageInput = screen.getByLabelText(/Transmission/i)
    const submitButton = screen.getByRole("button", { name: /Send Message/i })

    fireEvent.change(nameInput, { target: { value: "John Doe" } })
    fireEvent.change(emailInput, { target: { value: "john@example.com" } })
    fireEvent.change(messageInput, { target: { value: "Hello Noori!" } })

    fireEvent.click(submitButton)

    // Check loading state
    expect(screen.getByText(/Transmitting.../i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for success message (page uses 1500ms timeout)
    await waitFor(() => {
      expect(screen.getByText(/Transmission Received/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText(/Your message has been securely transmitted/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Send Another Message/i })).toBeInTheDocument()
  })

  it("allows sending another message after success", async () => {
    render(<ContactPage />)

    // Fill and submit
    fireEvent.change(screen.getByLabelText(/Identity/i), { target: { value: "John" } })
    fireEvent.change(screen.getByLabelText(/Communication Node/i), { target: { value: "john@test.com" } })
    fireEvent.change(screen.getByLabelText(/Transmission/i), { target: { value: "Test" } })
    fireEvent.click(screen.getByRole("button", { name: /Send Message/i }))

    // Wait for success
    await waitFor(() => screen.getByText(/Transmission Received/i), { timeout: 3000 })

    // Click "Send Another Message"
    fireEvent.click(screen.getByRole("button", { name: /Send Another Message/i }))

    // Form should be back
    expect(screen.getByLabelText(/Identity/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Send Message/i })).toBeInTheDocument()
  })
})
