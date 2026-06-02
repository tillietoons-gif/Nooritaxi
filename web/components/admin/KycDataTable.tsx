"use client";

import * as React from "react";
import { KycReviewModal } from "./KycReviewModal";
import { DriverDocument, updateDocumentStatus } from "@/lib/api";

interface KycDataTableProps {
  initialDocuments: DriverDocument[];
}

export function KycDataTable({ initialDocuments }: KycDataTableProps) {
  const [documents, setDocuments] = React.useState<DriverDocument[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = React.useState<DriverDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleReview = (doc: DriverDocument) => {
    setSelectedDocument(doc);
  };

  const handleCloseModal = () => {
    setSelectedDocument(null);
  };

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedDocument) return;

    setIsSubmitting(true);
    const documentId = selectedDocument.id;

    try {
      await updateDocumentStatus(documentId, status);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
      handleCloseModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-md border p-4">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Driver Name</th>
              <th className="px-6 py-3">Document Type</th>
              <th className="px-6 py-3">Submitted At</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{doc.driver?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">{doc.documentType.replace('_', ' ')}</td>
                  <td className="px-6 py-4">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">{doc.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => handleReview(doc)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No pending documents to review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <KycReviewModal
        isOpen={!!selectedDocument}
        onClose={handleCloseModal}
        document={selectedDocument}
        onApprove={() => handleUpdateStatus('APPROVED')}
        onReject={() => handleUpdateStatus('REJECTED')}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
