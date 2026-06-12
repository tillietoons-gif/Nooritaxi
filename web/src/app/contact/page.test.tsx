import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ContactPage from "./page"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}))

vi.mock("@/components/layout/header", () => ({
  Header: () => <div>Header</div>,
}))

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <div>Footer</div>,
}))

vi.mock("@/components/ui/pattern-overlay", () => ({
  PatternOverlay: () => <div>PatternOverlay</div>,
}))

describe("ContactPage", () => {
  it("renders correctly", () => {
    render(<ContactPage />)
    expect(screen.getByText("Contact Us")).toBeInTheDocument()
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
  })

  it("shows success state after submission", async () => {
    render(<ContactPage />)

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "John Doe" } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "john@example.com" } })
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: "Hello" } })

    fireEvent.click(screen.getByRole("button", { name: /Send Message/i }))

    expect(screen.getByText(/Sending/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Message Sent")).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
