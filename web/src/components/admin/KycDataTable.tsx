"use client";

import * as React from "react";
import { KycReviewModal } from "./KycReviewModal";
import { DriverDocument, getPendingKycDocuments, updateDocumentStatus } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface KycDataTableProps {
  initialDocuments?: DriverDocument[];
}

function driverName(doc: DriverDocument) {
  return doc.driver?.user?.name || doc.driver?.name || doc.driver?.user?.phone || "Unknown";
}

export function KycDataTable({ initialDocuments = [] }: KycDataTableProps) {
  const [documents, setDocuments] = React.useState<DriverDocument[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = React.useState<DriverDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadDocuments = React.useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setDocuments(await getPendingKycDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KYC documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleReview = (doc: DriverDocument) => {
    setSelectedDocument(doc);
  };

  const handleCloseModal = () => {
    setSelectedDocument(null);
  };

  const handleUpdateStatus = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedDocument) return;

    setIsSubmitting(true);
    const documentId = selectedDocument.id;

    try {
      await updateDocumentStatus(documentId, status);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
      handleCloseModal();
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to update document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-background shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-semibold">Pending Documents</h2>
            <p className="text-sm text-muted-foreground">{documents.length} document{documents.length === 1 ? "" : "s"} awaiting review</p>
          </div>
          <Button variant="outline" onClick={() => void loadDocuments()} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="m-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-6 py-3">Driver Name</th>
              <th className="px-6 py-3">Document Type</th>
              <th className="px-6 py-3">Submitted At</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  Loading pending documents...
                </td>
              </tr>
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{driverName(doc)}</td>
                  <td className="px-6 py-4">{doc.type.replaceAll('_', ' ')}</td>
                  <td className="px-6 py-4">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{doc.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" onClick={() => handleReview(doc)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No pending documents to review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <KycReviewModal
        isOpen={!!selectedDocument}
        onClose={handleCloseModal}
        document={selectedDocument}
        onApprove={() => handleUpdateStatus('VERIFIED')}
        onReject={() => handleUpdateStatus('REJECTED')}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
