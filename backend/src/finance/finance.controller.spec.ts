import { FinanceController } from './finance.controller';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';

describe('FinanceController', () => {
  let controller: FinanceController;
  let financeService: {
    getCashCollections: jest.Mock;
    getSystemCommissions: jest.Mock;
    setSystemCommission: jest.Mock;
    getSettlements: jest.Mock;
    collectCash: jest.Mock;
    getRefundRequests: jest.Mock;
    processRefund: jest.Mock;
    getFinanceAnalytics: jest.Mock;
  };

  beforeEach(() => {
    financeService = {
      getCashCollections: jest.fn(),
      getSystemCommissions: jest.fn(),
      setSystemCommission: jest.fn(),
      getSettlements: jest.fn(),
      collectCash: jest.fn(),
      getRefundRequests: jest.fn(),
      processRefund: jest.fn(),
      getFinanceAnalytics: jest.fn(),
    };

    controller = new FinanceController(financeService as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires finance.view permission for cash collections', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      FinanceController.prototype.getCashCollections,
    );

    expect(permissions).toEqual(['finance.view']);
  });

  it('requires finance.view permission for finance analytics', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      FinanceController.prototype.getAnalytics,
    );

    expect(permissions).toEqual(['finance.view']);
  });

  it('requires finance.view permission for refund requests', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      FinanceController.prototype.getRefundRequests,
    );

    expect(permissions).toEqual(['finance.view']);
  });

  it('requires finance.edit permission for refund processing', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      FinanceController.prototype.processRefund,
    );

    expect(permissions).toEqual(['finance.edit']);
  });

  it('passes the optional refund status filter through to the finance service', () => {
    controller.getRefundRequests('PENDING');

    expect(financeService.getRefundRequests).toHaveBeenCalledWith('PENDING');
  });
});
