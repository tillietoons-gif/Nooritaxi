"use client";

import Image from "next/image";
import { DriverDocument, getFullImageUrl } from "@/lib/api";

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
  if (!document || !isOpen) {
    return null;
  }

  const imageUrl = getFullImageUrl(document.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Review Document: {document.documentType.replace('_', ' ')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">Driver: {document.driver?.name || 'Unknown'}</p>
        
        <div className="relative w-full h-[400px] bg-gray-100 rounded-md mb-6 flex items-center justify-center overflow-hidden">
          <Image
            src={imageUrl}
            alt={`Document for ${document.driver?.name}`}
            fill
            className="object-contain"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium disabled:opacity-50"
            onClick={onReject}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Reject'}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded font-medium disabled:opacity-50"
            onClick={onApprove}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
