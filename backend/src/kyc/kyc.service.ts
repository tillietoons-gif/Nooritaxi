import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DocumentStatus, DriverDocument } from '@prisma/client';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async createDriverDocument(
    file: Express.Multer.File,
    userId: string,
    createDocumentDto: CreateDocumentDto,
  ): Promise<DriverDocument> {
    try {
      const { documentType } = createDocumentDto;
      const documentUrl = file.path;

      const newDocument = await this.prisma.driverDocument.create({
        data: {
          driverId: userId,
          type: documentType,
          url: documentUrl,
          status: DocumentStatus.PENDING,
        },
      });

      return newDocument;
    } catch (error) {
      console.error('Error creating driver document:', error);
      throw new InternalServerErrorException(
        'Could not save document information.',
      );
    }
  }
}
