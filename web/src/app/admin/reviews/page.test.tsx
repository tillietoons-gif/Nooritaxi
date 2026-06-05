import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AdminReviewsPage from "./page"
import { authedFetch } from "@/lib/auth"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/components/auth-gate", () => ({
  AuthGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/lib/auth", () => ({
  authedFetch: vi.fn(),
}))

const mockedAuthedFetch = vi.mocked(authedFetch)

function createResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

describe("AdminReviewsPage", () => {
  beforeEach(() => {
    mockedAuthedFetch.mockReset()
  })

  it("loads live reviews and refreshes after hiding a review", async () => {
    let reviews = [
      {
        id: "review-1",
        targetType: "DRIVER",
        targetUserId: "driver-user-1",
        rating: 2,
        comment: "Driver asked for extra cash.",
        isVisible: true,
        createdAt: "2026-06-01T09:00:00.000Z",
        author: { id: "author-1", name: "Karim M.", phone: "+93000000010" },
        targetUser: { id: "driver-user-1", name: "Demo Driver", phone: "+93000000020" },
        restaurant: null,
        trip: { id: "trip-100" },
        order: null,
        delivery: null,
      },
    ]

    mockedAuthedFetch.mockImplementation(async (path, init) => {
      if (path === "/admin/reviews?page=1&limit=25") {
        return createResponse({ items: reviews, total: reviews.length, page: 1, limit: 25 })
      }

      if (path === "/admin/reviews/review-1/visibility" && init?.method === "PATCH") {
        reviews = [{ ...reviews[0], isVisible: false }]
        return createResponse(reviews[0])
      }

      throw new Error(`Unexpected request: ${path}`)
    })

    const user = userEvent.setup()

    render(<AdminReviewsPage />)

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith("/admin/reviews?page=1&limit=25")
    })

    expect(await screen.findByText("Karim M.")).toBeInTheDocument()
    expect(screen.getByText("Driver (Demo Driver)")).toBeInTheDocument()
    expect(screen.getByText("Driver asked for extra cash.")).toBeInTheDocument()
    expect(screen.getAllByText("VISIBLE")).toHaveLength(2)
    expect(screen.getByText("Low Rating")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /hide/i }))

    await waitFor(() => {
      expect(mockedAuthedFetch).toHaveBeenCalledWith(
        "/admin/reviews/review-1/visibility",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isVisible: false }),
        }),
      )
    })

    expect(await screen.findAllByText("HIDDEN")).toHaveLength(2)
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument()
  })
})