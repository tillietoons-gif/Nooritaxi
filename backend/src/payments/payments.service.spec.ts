import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaMock: any;
  let walletServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      wallet: {
        upsert: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    walletServiceMock = {
      deposit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: WalletService, useValue: walletServiceMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIntent', () => {
    it('should throw BadRequestException if amount is non-positive', async () => {
      await expect(
        service.createIntent({ userId: 'user-1', amount: -10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create payment intent and return clientSecret without calling findUniqueOrThrow', async () => {
      prismaMock.wallet.upsert.mockResolvedValue({ id: 'wallet-1', userId: 'user-1', currency: 'AFN' });
      prismaMock.transaction.create.mockResolvedValue({
        id: 'tx-1',
        walletId: 'wallet-1',
        amount: 100,
        status: 'PENDING',
        providerRef: 'cs_intent-1',
      });

      const result = await service.createIntent({
        userId: 'user-1',
        amount: 100,
        currency: 'AFN',
        provider: 'HESABPAY',
      });

      expect(prismaMock.wallet.upsert).toHaveBeenCalledWith({
        where: { userId_type_currency: { userId: 'user-1', type: 'CUSTOMER', currency: 'AFN' } },
        update: {},
        create: { userId: 'user-1', type: 'CUSTOMER', currency: 'AFN', balance: 0 },
      });
      expect(prismaMock.wallet.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(prismaMock.transaction.create).toHaveBeenCalled();
      expect(result).toEqual({
        intentId: 'tx-1',
        clientSecret: expect.any(String),
        provider: 'HESABPAY',
        amount: 100,
        currency: 'AFN',
        status: 'PENDING',
      });
    });
  });

  describe('verifyPayment', () => {
    it('should throw NotFoundException if payment intent does not exist', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      await expect(service.verifyPayment('tx-1')).rejects.toThrow(NotFoundException);
    });

    it('should return completed state if transaction is already completed', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({
        id: 'tx-1',
        status: 'COMPLETED',
      });

      const result = await service.verifyPayment('tx-1');
      expect(result).toEqual({
        success: true,
        transaction: expect.objectContaining({ id: 'tx-1', status: 'COMPLETED' }),
      });
      expect(walletServiceMock.deposit).not.toHaveBeenCalled();
    });

    it('should verify payment, deposit funds, and update transaction to COMPLETED', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({
        id: 'tx-1',
        walletId: 'wallet-1',
        amount: 150,
        status: 'PENDING',
        tripId: 'trip-1',
      });
      prismaMock.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        currency: 'AFN',
      });

      const result = await service.verifyPayment('tx-1', 'ref-1', 'actor-1');

      expect(prismaMock.wallet.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
      });
      expect(walletServiceMock.deposit).toHaveBeenCalledWith(
        'user-1',
        150,
        'CUSTOMER',
        'AFN',
        'verified:tx-1',
        {
          transactionType: 'DEPOSIT',
          description: 'Payment verified (ref: ref-1)',
          tripId: 'trip-1',
          orderId: undefined,
          deliveryId: undefined,
        },
      );
      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: { status: 'COMPLETED', providerRef: 'ref-1' },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PAYMENT_VERIFIED',
          entityType: 'Transaction',
          entityId: 'tx-1',
          actorId: 'actor-1',
          after: { providerRef: 'ref-1', status: 'COMPLETED' },
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('listTransactions', () => {
    it('should fetch transactions and total count concurrently using Promise.all', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([{ id: 'tx-1' }]);
      prismaMock.transaction.count.mockResolvedValue(1);

      const result = await service.listTransactions('user-1', 1, 10);

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { wallet: { userId: 'user-1' } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prismaMock.transaction.count).toHaveBeenCalledWith({
        where: { wallet: { userId: 'user-1' } },
      });
      expect(result).toEqual({
        items: [{ id: 'tx-1' }],
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getIntent', () => {
    it('should find unique transaction by id', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({ id: 'tx-1' });
      const result = await service.getIntent('tx-1');
      expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
      });
      expect(result).toEqual({ id: 'tx-1' });
    });
  });

  describe('refundPayment', () => {
    it('should throw NotFoundException if transaction to refund is not found', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      await expect(service.refundPayment('tx-1')).rejects.toThrow(NotFoundException);
    });

    it('should initiate refund deposit', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({
        id: 'tx-1',
        walletId: 'wallet-1',
        amount: 200,
      });
      prismaMock.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        currency: 'AFN',
      });
      walletServiceMock.deposit.mockResolvedValue({ id: 'wallet-1', balance: 200 });

      const result = await service.refundPayment('tx-1', 100);

      expect(walletServiceMock.deposit).toHaveBeenCalledWith(
        'user-1',
        100,
        'CUSTOMER',
        'AFN',
        'refund:tx-1',
        {
          transactionType: 'REFUND',
          description: 'Payment refunded',
        },
      );
      expect(result).toEqual({ id: 'wallet-1', balance: 200 });
    });
  });
});
