import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrismaService = {
    wallet: {
      upsert: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockWalletService = {
    deposit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIntent', () => {
    it('should throw BadRequestException if amount is <= 0', async () => {
      await expect(
        service.createIntent({
          userId: 'user-1',
          amount: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createIntent({
          userId: 'user-1',
          amount: -50,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a payment intent successfully using the captured wallet from upsert', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        currency: 'AFN',
        balance: 0,
      };
      const mockTx = {
        id: 'tx-1',
        walletId: 'wallet-1',
        amount: 100,
        status: 'PENDING',
      };

      mockPrismaService.wallet.upsert.mockResolvedValue(mockWallet);
      mockPrismaService.transaction.create.mockResolvedValue(mockTx);

      const result = (await service.createIntent({
        userId: 'user-1',
        amount: 100,
        currency: 'AFN',
      })) as {
        intentId: string;
        clientSecret: string;
        provider: string;
        amount: number;
        currency: string;
        status: string;
      };

      expect(mockPrismaService.wallet.upsert).toHaveBeenCalledWith({
        where: {
          userId_type_currency: {
            userId: 'user-1',
            type: 'CUSTOMER',
            currency: 'AFN',
          },
        },
        update: {},
        create: {
          userId: 'user-1',
          type: 'CUSTOMER',
          currency: 'AFN',
          balance: 0,
        },
      });
      // Verification that findUniqueOrThrow is NOT called due to our optimization
      expect(mockPrismaService.wallet.findUniqueOrThrow).not.toHaveBeenCalled();

      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
      expect(result).toEqual({
        intentId: 'tx-1',
        clientSecret: expect.any(String) as string,
        provider: 'HESABPAY',
        amount: 100,
        currency: 'AFN',
        status: 'PENDING',
      });
    });
  });

  describe('verifyPayment', () => {
    it('should throw NotFoundException if payment intent does not exist', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.verifyPayment('tx-not-found')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return success immediately if transaction is already completed', async () => {
      const mockTx = { id: 'tx-1', status: 'COMPLETED' };
      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTx);

      const result = await service.verifyPayment('tx-1');
      expect(result).toEqual({ success: true, transaction: mockTx });
      expect(mockWalletService.deposit).not.toHaveBeenCalled();
    });

    it('should complete transaction, deposit funds, and write audit log on success', async () => {
      const mockTx = {
        id: 'tx-1',
        walletId: 'wallet-1',
        amount: 500,
        currency: 'AFN',
        status: 'PENDING',
        providerRef: 'ref-old',
      };
      const mockWallet = { id: 'wallet-1', userId: 'user-1', currency: 'AFN' };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTx);
      mockPrismaService.wallet.findUniqueOrThrow.mockResolvedValue(mockWallet);
      mockWalletService.deposit.mockResolvedValue({ id: 'dep-1' });
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTx,
        status: 'COMPLETED',
        providerRef: 'ref-new',
      });

      const result = (await service.verifyPayment(
        'tx-1',
        'ref-new',
        'actor-1',
      )) as { success: boolean; transaction: { status: string } };

      expect(mockWalletService.deposit).toHaveBeenCalledWith(
        'user-1',
        500,
        'CUSTOMER',
        'AFN',
        'verified:tx-1',
        {
          transactionType: 'DEPOSIT',
          description: 'Payment verified (ref: ref-new)',
          tripId: undefined,
          orderId: undefined,
          deliveryId: undefined,
        },
      );
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: { status: 'COMPLETED', providerRef: 'ref-new' },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PAYMENT_VERIFIED',
          entityType: 'Transaction',
          entityId: 'tx-1',
          actorId: 'actor-1',
          after: { providerRef: 'ref-new', status: 'COMPLETED' },
        },
      });
      expect(result.success).toBe(true);
      expect(result.transaction.status).toBe('COMPLETED');
    });
  });

  describe('listTransactions', () => {
    it('should list and count transactions in parallel', async () => {
      const mockTransactions = [{ id: 'tx-1' }, { id: 'tx-2' }];
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );
      mockPrismaService.transaction.count.mockResolvedValue(2);

      const result = await service.listTransactions('user-1', 1, 10);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { wallet: { userId: 'user-1' } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(mockPrismaService.transaction.count).toHaveBeenCalledWith({
        where: { wallet: { userId: 'user-1' } },
      });
      expect(result).toEqual({
        items: mockTransactions,
        total: 2,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getIntent', () => {
    it('should call transaction.findUnique', async () => {
      const mockTx = { id: 'tx-1' };
      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTx);

      const result = await service.getIntent('tx-1');
      expect(mockPrismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
      });
      expect(result).toEqual(mockTx);
    });
  });

  describe('refundPayment', () => {
    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.refundPayment('tx-invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should process a refund successfully', async () => {
      const mockTx = { id: 'tx-1', walletId: 'wallet-1', amount: 150 };
      const mockWallet = { id: 'wallet-1', userId: 'user-1', currency: 'AFN' };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTx);
      mockPrismaService.wallet.findUniqueOrThrow.mockResolvedValue(mockWallet);
      mockWalletService.deposit.mockResolvedValue({ id: 'ref-tx-1' });

      const result = await service.refundPayment('tx-1');

      expect(mockWalletService.deposit).toHaveBeenCalledWith(
        'user-1',
        150,
        'CUSTOMER',
        'AFN',
        'refund:tx-1',
        {
          transactionType: 'REFUND',
          description: 'Payment refunded',
        },
      );
      expect(result).toEqual({ id: 'ref-tx-1' });
    });
  });
});
