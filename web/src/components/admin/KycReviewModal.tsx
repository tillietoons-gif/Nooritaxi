"use client";

import { DriverDocument, getFullImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KycReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DriverDocument | null;
  onApprove: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}

export function KycReviewModal({
  isOpen,
  onClose,
  document,
  onApprove,
  onReject,
  isSubmitting,
}: KycReviewModalProps) {
  const documentUrl = document ? getFullImageUrl(document.url) : "";
  const isPdf = documentUrl.toLowerCase().includes(".pdf");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
        {document ? (
          <>
            <DialogHeader>
              <DialogTitle>Review {document.type.replaceAll("_", " ")}</DialogTitle>
              <DialogDescription>
                Driver: {document.driver?.user?.name || document.driver?.name || document.driver?.user?.phone || "Unknown"}
              </DialogDescription>
            </DialogHeader>

            <div className="h-[52vh] overflow-hidden rounded-md border bg-muted/30">
              {isPdf ? (
                <iframe src={documentUrl} title={`Document for ${document.driver?.user?.name ?? "driver"}`} className="h-full w-full" />
              ) : (
                // Plain img avoids Next image host configuration for local backend file URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={documentUrl}
                  alt={`Document for ${document.driver?.user?.name ?? "driver"}`}
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onReject} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Reject"}
              </Button>
              <Button type="button" onClick={onApprove} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Approve"}
              </Button>
            </div>
          </>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">No document selected.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
