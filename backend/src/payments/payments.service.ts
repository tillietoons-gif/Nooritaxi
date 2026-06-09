import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { randomUUID } from 'crypto';

type Provider = 'HESABPAY' | 'STRIPE' | 'M_PESA';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  /**
   * Creates a payment intent — records a PENDING Transaction row and returns
   * the intent details. Real providers (HesabPay, Stripe) would return a
   * client_secret here; this mock returns a deterministic ref that can be
   * verified in verifyPayment().
   */
  async createIntent(data: {
    userId: string;
    amount: number;
    currency?: string;
    provider?: Provider;
    tripId?: string;
    orderId?: string;
    deliveryId?: string;
  }) {
    const {
      userId,
      amount,
      currency = 'AFN',
      provider = 'HESABPAY',
      tripId,
      orderId,
      deliveryId,
    } = data;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    // Upsert user CUSTOMER wallet so it exists
    await this.prisma.wallet.upsert({
      where: { userId_type_currency: { userId, type: 'CUSTOMER', currency } },
      update: {},
      create: { userId, type: 'CUSTOMER', currency, balance: 0 },
    });

    const idempotencyKey = `intent:${provider}:${userId}:${Date.now()}-${randomUUID().slice(0, 8)}`;
    const clientSecret = `cs_${idempotencyKey}`;

    const wallet = await this.prisma.wallet.findUniqueOrThrow({
      where: { userId_type_currency: { userId, type: 'CUSTOMER', currency } },
    });

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        provider,
        providerRef: clientSecret,
        idempotencyKey,
        description: `${provider} payment intent`,
        tripId,
        orderId,
        deliveryId,
      },
    });

    this.logger.log(
      `Payment intent created: ${transaction.id} (${provider}, ${amount} ${currency})`,
    );

    return {
      intentId: transaction.id,
      clientSecret,
      provider,
      amount,
      currency,
      status: 'PENDING',
    };
  }

  /**
   * Verifies a payment intent and, on success, credits the user's wallet.
   * In production this would call the provider's verify API. Here it always
   * succeeds to unblock development and testing.
   */
  async verifyPayment(
    intentId: string,
    providerRef?: string,
    actorId?: string,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: intentId },
    });
    if (!transaction) throw new NotFoundException('Payment intent not found');
    if (transaction.status === 'COMPLETED')
      return { success: true, transaction };

    const wallet = await this.prisma.wallet.findUniqueOrThrow({
      where: { id: transaction.walletId },
    });
    const resolvedProviderRef = providerRef ?? transaction.providerRef ?? undefined;

    this.logger.log(
      `Verifying payment intent ${intentId} (ref: ${resolvedProviderRef ?? 'n/a'})`,
    );

    // Credit wallet
    await this.wallet.deposit(
      wallet.userId,
      Number(transaction.amount),
      'CUSTOMER',
      wallet.currency,
      `verified:${intentId}`,
      {
        transactionType: 'DEPOSIT',
        description: resolvedProviderRef
          ? `Payment verified (ref: ${resolvedProviderRef})`
          : 'Payment verified',
        tripId: transaction.tripId ?? undefined,
        orderId: transaction.orderId ?? undefined,
        deliveryId: transaction.deliveryId ?? undefined,
      },
    );

    // Mark original PENDING transaction completed
    await this.prisma.transaction.update({
      where: { id: intentId },
      data: { status: 'COMPLETED', providerRef: resolvedProviderRef },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_VERIFIED',
        entityType: 'Transaction',
        entityId: intentId,
        actorId,
        after: { providerRef: resolvedProviderRef, status: 'COMPLETED' },
      },
    });

    return {
      success: true,
      transaction: { ...transaction, status: 'COMPLETED' },
    };
  }

  async listTransactions(userId: string, page = 1, limit = 25) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.transaction.count({ where: { wallet: { userId } } }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  getIntent(id: string) {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async refundPayment(intentId: string, amount?: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: intentId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    const wallet = await this.prisma.wallet.findUniqueOrThrow({
      where: { id: transaction.walletId },
    });
    const refundAmount = amount ?? Number(transaction.amount);
    this.logger.log(`Refund ${intentId} amount=${refundAmount}`);
    return this.wallet.deposit(
      wallet.userId,
      refundAmount,
      'CUSTOMER',
      wallet.currency,
      `refund:${intentId}`,
      {
        transactionType: 'REFUND',
        description: 'Payment refunded',
      },
    );
  }
}
