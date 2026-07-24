import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma.service';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: {
    wallet: {
      findUnique: jest.Mock;
    };
    transaction: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      wallet: {
        findUnique: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listTransactions', () => {
    it('should retrieve wallet transactions concurrently and return items with pagination and hasMore', async () => {
      const mockItems = [{ id: 'tx-1', amount: 50 }];
      prisma.transaction.findMany.mockResolvedValue(mockItems);
      prisma.transaction.count.mockResolvedValue(1);

      const result = await service.listTransactions('user-1', 1, 10, 'CUSTOMER');

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            wallet: {
              userId: 'user-1',
              type: 'CUSTOMER',
              currency: 'AFN',
            },
          },
          skip: 0,
          take: 10,
        }),
      );
      expect(prisma.transaction.count).toHaveBeenCalledWith({
        where: {
          wallet: {
            userId: 'user-1',
            type: 'CUSTOMER',
            currency: 'AFN',
          },
        },
      });
      expect(result).toEqual({
        items: mockItems,
        page: 1,
        limit: 10,
        total: 1,
        hasMore: false,
      });
    });
  });
});
