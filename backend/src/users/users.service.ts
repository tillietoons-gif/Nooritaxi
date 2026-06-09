import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, DocumentType, DocumentStatus, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async create(data: any): Promise<User> {
    const { role = UserRole.RIDER, ...userData } = data;

    return this.prisma.user.create({
      data: {
        ...userData,
        role,
        ...(role === UserRole.DRIVER
          ? { driverProfile: { create: {} } }
          : role === UserRole.RIDER
            ? { riderProfile: { create: {} } }
            : {}),
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async uploadKycDocument(driverId: string, type: DocumentType, url: string) {
    return this.prisma.driverDocument.create({
      data: {
        driverId,
        type,
        url,
        status: DocumentStatus.PENDING,
      },
    });
  }

  async listPendingKycDocuments(page = 1, limit = 25) {
    return this.prisma.driverDocument.findMany({
      where: { status: DocumentStatus.PENDING },
      include: { driver: { include: { user: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifyKycDocument(
    documentId: string,
    status: DocumentStatus,
    adminId: string,
  ) {
    const document = await this.prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        status,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
    });

    if (status === DocumentStatus.VERIFIED) {
      // Check if all required documents are verified for the driver to be activated
      // In a real app, you would define what set of documents is required.
      const pendingDocs = await this.prisma.driverDocument.count({
        where: { driverId: document.driverId, status: DocumentStatus.PENDING },
      });

      if (pendingDocs === 0) {
        await this.prisma.driver.update({
          where: { userId: document.driverId },
          data: { status: 'ONLINE' }, // Automatically activate driver if all docs are verified
        });
      }
    } else if (status === DocumentStatus.REJECTED) {
      await this.prisma.driver.update({
        where: { userId: document.driverId },
        data: { status: 'OFFLINE' },
      });
    }

    return document;
  }
}
