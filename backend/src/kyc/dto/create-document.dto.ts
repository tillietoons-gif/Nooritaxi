import { IsEnum, IsNotEmpty } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;
}
