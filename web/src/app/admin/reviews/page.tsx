"use client"

import { useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { authedFetch } from "@/lib/auth"
import { Check, EyeOff, Star } from "lucide-react"

type ReviewStatus = "VISIBLE" | "HIDDEN"

type Review = {
  id: string
  targetType: string
  targetUserId?: string | null
  rating: number
  comment?: string | null
  isVisible: boolean
  createdAt: string
  author: {
    id: string
    name?: string | null
    phone?: string | null
  }
  targetUser?: {
    id: string
    name?: string | null
    phone?: string | null
  } | null
  restaurant?: {
    id: string
    name?: string | null
  } | null
  trip?: {
    id: string
  } | null
  order?: {
    id: string
  } | null
  delivery?: {
    id: string
  } | null
}

const REVIEW_VISIBILITY_OPTIONS: ReviewStatus[] = ["VISIBLE", "HIDDEN"]

function getReviewStatus(review: Review): ReviewStatus {
  return review.isVisible ? "VISIBLE" : "HIDDEN"
}

function shortId(value?: string | null) {
  if (!value) return "Unknown"
  return value.slice(-8)
}

function getReviewTarget(review: Review) {
  if (review.targetType === "DRIVER") {
    const label = review.targetUser?.name ?? review.targetUser?.phone ?? shortId(review.targetUserId)
    return `Driver (${label})`
  }

  if (review.targetType === "RIDER") {
    const label = review.targetUser?.name ?? review.targetUser?.phone ?? shortId(review.targetUserId)
    return `Rider (${label})`
  }

  if (review.targetType === "RESTAURANT") {
    return `Restaurant (${review.restaurant?.name ?? shortId(review.restaurant?.id)})`
  }

  if (review.delivery?.id) {
    return `Delivery (${shortId(review.delivery.id)})`
  }

  if (review.order?.id) {
    return `Order (${shortId(review.order.id)})`
  }

  if (review.trip?.id) {
    return `Trip (${shortId(review.trip.id)})`
  }

  return review.targetType
}

export default function AdminReviewsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function updateReviewVisibility(id: string, isVisible: boolean) {
    setUpdatingId(id)
    try {
      const res = await authedFetch(`/admin/reviews/${id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message
        throw new Error(message ? `Failed to update review: ${message}` : `Failed to update review (${res.status})`)
      }
      setRefreshKey((key) => key + 1)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AuthGate roles={["ADMIN", "SUPPORT"]}>
      <AdminListPage<Review>
        key={refreshKey}
        title="Reviews"
        endpoint="/admin/reviews"
        statusOptions={REVIEW_VISIBILITY_OPTIONS}
        searchPlaceholder="Search by id, author, target, or comment..."
        rowKey={(review) => review.id}
        columns={[
          {
            key: "id",
            header: "Review",
            render: (review) => (
              <div>
                <span className="font-mono text-xs">{review.id.slice(-8)}</span>
                <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleString()}</p>
              </div>
            ),
          },
          {
            key: "author",
            header: "Author",
            render: (review) => review.author.name ?? review.author.phone ?? "Unknown author",
          },
          {
            key: "target",
            header: "Target Entity",
            render: (review) => getReviewTarget(review),
          },
          {
            key: "rating",
            header: "Rating",
            render: (review) => (
              <div className="flex items-center gap-1 font-bold text-gold">
                <Star className="h-4 w-4 fill-current" /> {review.rating.toFixed(1)}
              </div>
            ),
          },
          {
            key: "comment",
            header: "Comment",
            render: (review) => (
              <div className="max-w-sm">
                <p className="truncate text-muted-foreground">{review.comment?.trim() || "No comment provided."}</p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (review) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={getReviewStatus(review)} />
                {review.rating <= 2 ? <Badge variant="destructive">Low Rating</Badge> : null}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (review) =>
              review.isVisible ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateReviewVisibility(review.id, false)}
                  disabled={updatingId === review.id}
                >
                  <EyeOff className="mr-2 h-4 w-4" /> Hide
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => updateReviewVisibility(review.id, true)}
                  disabled={updatingId === review.id}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              ),
          },
        ]}
      />
    </AuthGate>
  )
}
