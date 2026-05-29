import { randomUUID } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Prisma,
  Transaction,
  TransactionType,
  Wallet,
  WalletType,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';

type WalletTx = Prisma.TransactionClient;

type LedgerOptions = {
  idempotencyKey?: string;
  transactionType?: TransactionType;
  description?: string;
  tripId?: string;
  orderId?: string;
  deliveryId?: string;
  tx?: WalletTx;
};

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string, type = 'CUSTOMER', currency = 'AFN') {
    return this.prisma.wallet.findUnique({
      where: { userId_type_currency: { userId, type: type as any, currency } },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 25 } },
    });
  }

  async listTransactions(
    userId: string,
    page = 1,
    limit = 25,
    type?: string,
    currency = 'AFN',
  ) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const walletWhere = {
      userId,
      ...(type ? { type: type as WalletType } : {}),
      currency,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { wallet: walletWhere },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.transaction.count({ where: { wallet: walletWhere } }),
    ]);

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total,
      hasMore: safePage * safeLimit < total,
    };
  }

  async deposit(
    userId: string,
    amount: number,
    type = 'CUSTOMER',
    currency = 'AFN',
    idempotencyKey?: string,
    options: LedgerOptions = {},
  ) {
    if (!Number.isFinite(amount) || amount <= 0)
      throw new BadRequestException('Deposit amount must be positive');

    const execute = async (tx: WalletTx) => {
      const wallet = await tx.wallet.upsert({
        where: {
          userId_type_currency: { userId, type: type as any, currency },
        },
        update: {},
        create: { userId, type: type as any, currency, balance: 0 },
      });

      const transaction = await this.upsertPendingTransaction(
        tx,
        wallet.id,
        amount,
        {
          ...options,
          idempotencyKey: idempotencyKey ?? options.idempotencyKey,
          transactionType: options.transactionType ?? 'DEPOSIT',
          description: options.description ?? 'Funds added',
        },
      );

      this.assertSameTransactionIntent(
        transaction,
        wallet.id,
        amount,
        options.transactionType ?? 'DEPOSIT',
      );
      if (transaction.status !== 'PENDING') return wallet;

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' },
      });
      return updated;
    };

    return options.tx ? execute(options.tx) : this.prisma.$transaction(execute);
  }

  async transfer(
    userId: string,
    amount: number,
    description = 'Wallet debit',
    idempotencyKey?: string,
    options: LedgerOptions = {},
  ) {
    if (!Number.isFinite(amount) || amount <= 0)
      throw new BadRequestException('Debit amount must be positive');

    const execute = async (tx: WalletTx) => {
      const wallet = await tx.wallet.findFirstOrThrow({
        where: { userId, type: 'CUSTOMER', currency: 'AFN' },
      });
      if (wallet.isFrozen) throw new BadRequestException('Wallet is frozen');

      const transaction = await this.upsertPendingTransaction(
        tx,
        wallet.id,
        -amount,
        {
          ...options,
          idempotencyKey: idempotencyKey ?? options.idempotencyKey,
          transactionType: options.transactionType ?? 'ADJUSTMENT',
          description,
        },
      );

      this.assertSameTransactionIntent(
        transaction,
        wallet.id,
        -amount,
        options.transactionType ?? 'ADJUSTMENT',
      );
      if (transaction.status !== 'PENDING') return wallet;

      if (Number(wallet.balance) < amount)
        throw new BadRequestException('Insufficient wallet balance');
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' },
      });
      return updated;
    };

    return options.tx ? execute(options.tx) : this.prisma.$transaction(execute);
  }

  private upsertPendingTransaction(
    tx: WalletTx,
    walletId: string,
    amount: number,
    options: LedgerOptions,
  ): Promise<Transaction> {
    const idempotencyKey = options.idempotencyKey ?? `wallet-${randomUUID()}`;

    return tx.transaction.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        walletId,
        amount,
        type: options.transactionType ?? 'ADJUSTMENT',
        status: 'PENDING',
        idempotencyKey,
        description: options.description,
        tripId: options.tripId,
        orderId: options.orderId,
        deliveryId: options.deliveryId,
      },
    });
  }

  private assertSameTransactionIntent(
    transaction: Transaction,
    walletId: string,
    amount: number,
    type: TransactionType,
  ) {
    if (
      transaction.walletId !== walletId ||
      Number(transaction.amount) !== amount ||
      transaction.type !== type
    ) {
      throw new BadRequestException(
        'Idempotency key was already used for a different wallet transaction',
      );
    }
  }
}
