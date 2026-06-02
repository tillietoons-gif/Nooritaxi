import { getPendingKycDocuments } from '@/lib/api';
import { KycDataTable } from '@/components/admin/KycDataTable';

export default async function KycReviewPage() {
  const pendingDocuments = await getPendingKycDocuments();

  return (
    <main className="container mx-auto py-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Driver KYC Review</h1>
        <p className="text-muted-foreground">
          Review and approve or reject pending driver documents.
        </p>
        
        <KycDataTable initialDocuments={pendingDocuments} />
      </div>
    </main>
  );
}

export const revalidate = 60;
