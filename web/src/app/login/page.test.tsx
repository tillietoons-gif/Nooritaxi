import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import LoginPage from "./page"
import { apiUrl, canAccessWebPortal, clearSession, getPostAuthRedirect, saveSession } from "@/lib/auth"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>{children}</a>
  ),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

vi.mock("lucide-react", () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />
  return {
    Lock: Icon,
    Phone: Icon,
    Eye: Icon,
    EyeOff: Icon,
    ShieldCheck: Icon,
    ArrowLeft: Icon,
  }
})

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}))

vi.mock("@/components/ui/glass-surface", () => ({
  GlassSurface: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}))

vi.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock("@/components/ui/typography", () => ({
  BodyMd: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
  HeadingMd: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
  LabelMd: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props}>{children}</label>,
}))

vi.mock("@/components/ui/noori-logo", () => ({
  NooriLogo: () => <div>NooriLogo</div>,
}))

vi.mock("@/lib/auth", () => ({
  apiUrl: "https://api.example.test",
  WEB_MOBILE_ONLY_REASON: "mobile-only",
  canAccessWebPortal: vi.fn(),
  clearSession: vi.fn(),
  getPostAuthRedirect: vi.fn(),
  saveSession: vi.fn(),
}))

const mockedCanAccessWebPortal = vi.mocked(canAccessWebPortal)
const mockedClearSession = vi.mocked(clearSession)
const mockedGetPostAuthRedirect = vi.mocked(getPostAuthRedirect)
const mockedSaveSession = vi.mocked(saveSession)

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedCanAccessWebPortal.mockReset()
    mockedClearSession.mockReset()
    mockedGetPostAuthRedirect.mockReset()
    mockedSaveSession.mockReset()
    mockedCanAccessWebPortal.mockImplementation((role) => role !== "DRIVER")
    mockedGetPostAuthRedirect.mockReturnValue("/dashboard")
    vi.stubGlobal("fetch", vi.fn())
  })

  it("blocks driver responses from creating a web session", async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "token-1",
        user: { id: "driver-1", phone: "+93000000001", role: "DRIVER", name: "Driver One" },
      }),
    } as Response)

    const user = userEvent.setup()

    render(<LoginPage />)

    await user.type(screen.getByLabelText(/mobile identifier/i), "+93000000001")
    await user.type(screen.getByLabelText(/security credential/i), "secret123")
    await user.click(screen.getByRole("button", { name: /initialize access/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Platform": "web",
        },
        body: JSON.stringify({ phone: "+93000000001", password: "secret123" }),
      })
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("Drivers must sign in through the mobile app.")
    expect(mockedClearSession).toHaveBeenCalledTimes(1)
    expect(mockedSaveSession).not.toHaveBeenCalled()
    expect(mockedGetPostAuthRedirect).not.toHaveBeenCalled()
  })
})