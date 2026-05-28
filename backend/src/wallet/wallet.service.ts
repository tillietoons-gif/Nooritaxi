import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}
  async getBalance(userId: string) { return this.prisma.wallet.findUnique({ where: { userId }, include: { transactions: true } }); }
  async deposit(userId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({ where: { userId }, update: { balance: { increment: amount } }, create: { userId, balance: amount } });
      await tx.transaction.create({ data: { walletId: wallet.id, amount, type: 'DEPOSIT', description: 'Funds added' } });
      return wallet;
    });
  }
}
