import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  /**
   * OCR VERIFICATION
   * Automatically extracts text from uploaded National ID / Tazkira / Driver License
   */
  async processOCR(documentUrl: string, documentType: string) {
    // TODO: Await Google Cloud Vision / Onfido / Veriff API Keys
    /*
      const [result] = await client.textDetection(documentUrl);
      const detections = result.textAnnotations;
      return parseExtractedText(detections, documentType);
    */
    console.log(`[KYC OCR MOCK] Extracting data from ${documentUrl}`);
    return { extractedName: "Ahmad", extractedIdNumber: "9988776655", confidence: 0.98 };
  }

  /**
   * SELFIE MATCHING
   * Compares live selfie to the face extracted from the National ID
   */
  async verifySelfieMatch(selfieUrl: string, documentUrl: string) {
    // TODO: Await AWS Rekognition or specialized Facial Match API
    console.log(`[KYC FACE MATCH MOCK] Comparing ${selfieUrl} against ${documentUrl}`);
    return { isMatch: true, similarityScore: 99.1 };
  }

  /**
   * AUTOMATED DOCUMENT APPROVAL
   */
  async createDriverDocument(driverId: string, type: any, url: string) {
    return this.prisma.driverDocument.create({
      data: { driverId, type, url, status: 'PENDING' }
    });
  }

  async autoVerifyDocument(documentId: string) {
    const doc = await this.prisma.driverDocument.findUnique({ where: { id: documentId } });
    if (!doc) return false;

    // Trigger OCR & Match (Mocking logic here)
    const ocrResult = await this.processOCR(doc.url, doc.type);
    
    if (ocrResult.confidence > 0.90) {
      return this.prisma.driverDocument.update({
        where: { id: documentId },
        data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedBy: 'AI_SYSTEM' }
      });
    }

    return doc;
  }
}
