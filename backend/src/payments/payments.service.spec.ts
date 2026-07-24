import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    wallet: {
      upsert: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    transaction: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    auditLog: {
      create: jest.Mock;
    };
  };
  let walletService: {
    deposit: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
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

    walletService = {
      deposit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: walletService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIntent', () => {
    it('should throw BadRequestException if amount is negative or invalid', async () => {
      await expect(
        service.createIntent({ userId: 'user-1', amount: -10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a payment intent successfully', async () => {
      prisma.wallet.upsert.mockResolvedValue({ id: 'wallet-1' });
      prisma.wallet.findUniqueOrThrow.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' });
      prisma.transaction.create.mockResolvedValue({
        id: 'tx-123',
        walletId: 'wallet-1',
        amount: 100,
        type: 'DEPOSIT',
        status: 'PENDING',
      });

      const result = await service.createIntent({
        userId: 'user-1',
        amount: 100,
        currency: 'AFN',
      });

      expect(prisma.wallet.upsert).toHaveBeenCalled();
      expect(prisma.wallet.findUniqueOrThrow).toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(result.intentId).toBe('tx-123');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('verifyPayment', () => {
    it('should throw NotFoundException if transaction is not found', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      await expect(service.verifyPayment('tx-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return success and early exit if transaction is already COMPLETED', async () => {
      const tx = { id: 'tx-123', status: 'COMPLETED' };
      prisma.transaction.findUnique.mockResolvedValue(tx);

      const result = await service.verifyPayment('tx-123');
      expect(result).toEqual({ success: true, transaction: tx });
      expect(walletService.deposit).not.toHaveBeenCalled();
    });

    it('should verify payment, deposit funds, and update transaction to COMPLETED', async () => {
      const tx = {
        id: 'tx-123',
        status: 'PENDING',
        amount: 100,
        walletId: 'wallet-1',
        tripId: 'trip-1',
        orderId: null,
        deliveryId: null,
        providerRef: 'cs_ref',
      };
      prisma.transaction.findUnique.mockResolvedValue(tx);
      prisma.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        currency: 'AFN',
      });
      walletService.deposit.mockResolvedValue({ id: 'wallet-1', balance: 100 });
      prisma.transaction.update.mockResolvedValue({ ...tx, status: 'COMPLETED' });

      const result = await service.verifyPayment('tx-123', 'prov-ref-123', 'actor-1');

      expect(walletService.deposit).toHaveBeenCalledWith(
        'user-1',
        100,
        'CUSTOMER',
        'AFN',
        'verified:tx-123',
        {
          transactionType: 'DEPOSIT',
          description: 'Payment verified (ref: prov-ref-123)',
          tripId: 'trip-1',
          orderId: undefined,
          deliveryId: undefined,
        },
      );
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-123' },
        data: { status: 'COMPLETED', providerRef: 'prov-ref-123' },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('listTransactions', () => {
    it('should retrieve transactions concurrently and return items with pagination', async () => {
      const mockItems = [{ id: 'tx-1', amount: 100 }];
      prisma.transaction.findMany.mockResolvedValue(mockItems);
      prisma.transaction.count.mockResolvedValue(1);

      const result = await service.listTransactions('user-1', 1, 10);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { wallet: { userId: 'user-1' } },
          skip: 0,
          take: 10,
        }),
      );
      expect(prisma.transaction.count).toHaveBeenCalledWith({
        where: { wallet: { userId: 'user-1' } },
      });
      expect(result).toEqual({
        items: mockItems,
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getIntent', () => {
    it('should return the transaction intent', async () => {
      const tx = { id: 'tx-123', amount: 100 };
      prisma.transaction.findUnique.mockResolvedValue(tx);

      const result = await service.getIntent('tx-123');
      expect(result).toBe(tx);
    });
  });

  describe('refundPayment', () => {
    it('should throw NotFoundException if refund transaction not found', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      await expect(service.refundPayment('tx-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should process refund successfully', async () => {
      const tx = { id: 'tx-123', walletId: 'wallet-1', amount: 150 };
      prisma.transaction.findUnique.mockResolvedValue(tx);
      prisma.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        currency: 'AFN',
      });
      walletService.deposit.mockResolvedValue({ id: 'wallet-1' });

      await service.refundPayment('tx-123', 100);

      expect(walletService.deposit).toHaveBeenCalledWith(
        'user-1',
        100,
        'CUSTOMER',
        'AFN',
        'refund:tx-123',
        {
          transactionType: 'REFUND',
          description: 'Payment refunded',
        },
      );
    });
  });
});
