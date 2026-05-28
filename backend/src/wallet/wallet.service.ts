import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}
  async getBalance(userId: string, type = 'CUSTOMER', currency = 'AFN') {
    return this.prisma.wallet.findUnique({
      where: { userId_type_currency: { userId, type: type as any, currency } },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 25 } },
    });
  }
  async deposit(userId: string, amount: number, type = 'CUSTOMER', currency = 'AFN') {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId_type_currency: { userId, type: type as any, currency } },
        update: { balance: { increment: amount } },
        create: { userId, type: type as any, currency, balance: amount },
      });
      await tx.transaction.create({ data: { walletId: wallet.id, amount, type: 'DEPOSIT', description: 'Funds added' } });
      return wallet;
    });
  }
  async transfer(userId: string, amount: number, description = 'Wallet debit') {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirstOrThrow({ where: { userId, type: 'CUSTOMER', currency: 'AFN' } });
      const updated = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
      await tx.transaction.create({ data: { walletId: wallet.id, amount: -amount, type: 'ADJUSTMENT', description } });
      return updated;
    });
  }
}
