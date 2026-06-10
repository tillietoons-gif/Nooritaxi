import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ContactPage from "./page"
import React from "react"

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}))

// Mock Header and Footer
vi.mock("@/components/layout/header", () => ({
  Header: () => <header>Header</header>,
}))
vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer>Footer</footer>,
}))

describe("ContactPage", () => {
  it("renders the contact form", () => {
    render(<ContactPage />)
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email or Phone")).toBeInTheDocument()
    expect(screen.getByLabelText("Message")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send Message" })).toBeInTheDocument()
  })

  it("shows loading state and then success message on submit", async () => {
    render(<ContactPage />)

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "John Doe" } })
    fireEvent.change(screen.getByLabelText("Email or Phone"), { target: { value: "john@example.com" } })
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello!" } })

    fireEvent.click(screen.getByRole("button", { name: "Send Message" }))

    expect(screen.getByText("Sending...")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Message Sent!")).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByText("Thank you for reaching out. Our team will get back to you shortly.")).toBeInTheDocument()
  })

  it("can return to form from success state", async () => {
    render(<ContactPage />)

    // Fill and submit
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "John Doe" } })
    fireEvent.change(screen.getByLabelText("Email or Phone"), { target: { value: "john@example.com" } })
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello!" } })
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }))

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText("Message Sent!")).toBeInTheDocument()
    }, { timeout: 2000 })

    // Click "Send another message"
    fireEvent.click(screen.getByText("Send another message"))

    // Should be back at the form
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
  })
})
