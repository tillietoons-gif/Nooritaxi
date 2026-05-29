import { Body, Controller, ForbiddenException, Get, Param, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DebitDto, DepositDto } from './dto';
import { PaymentsService } from '../payments/payments.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private walletService: WalletService,
    private paymentsService: PaymentsService,
  ) {}

  @Get(':userId/transactions')
  getTransactions(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('currency') currency?: string,
  ) {
    return this.walletService.listTransactions(
      userId,
      Number(page ?? 1),
      Number(limit ?? 25),
      type,
      currency ?? 'AFN',
    );
  }

  @Get(':userId')
  getBalance(@Param('userId') userId: string, @Query('type') type?: string, @Query('currency') currency?: string) {
    return this.walletService.getBalance(userId, type, currency);
  }

  @Post(':userId/deposit')
  deposit(@Param('userId') userId: string, @Body() body: DepositDto, @CurrentUser() user: any) {
    const canDeposit = user?.id === userId || [UserRole.ADMIN, UserRole.SUPPORT].includes(user?.role);
    if (!canDeposit) throw new ForbiddenException('Cannot top up another user wallet');
    return this.walletService.deposit(userId, body.amount, body.type, body.currency, body.idempotencyKey, {
      description: body.description,
    });
  }

  @Post(':userId/debit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  debit(@Param('userId') userId: string, @Body() body: DebitDto) {
    return this.walletService.transfer(userId, body.amount, body.description, body.idempotencyKey);
  }

  @Post(':userId/topup/initiate')
  initiateTopup(@Param('userId') userId: string, @Body() body: { amount: number; currency?: string; provider?: 'HESABPAY' | 'STRIPE' | 'M_PESA' }, @CurrentUser() user: any) {
    if (user?.id !== userId && user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Cannot top up another user wallet');
    }
    return this.paymentsService.createIntent({ userId, amount: body.amount, currency: body.currency ?? 'AFN', provider: body.provider });
  }

  @Post(':userId/topup/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async verifyTopup(@Param('userId') userId: string, @Body() body: { transactionId: string; provider: string; amount: number; currency?: string }, @CurrentUser() user: any) {
    // SECURITY: The PaymentsService.verifyPayment stub returns true unconditionally,
    // which would let any caller credit a wallet for any transactionId. Until a real
    // payment integration with provider-signed webhooks lands, this endpoint is
    // restricted to ADMIN. See payments.service.ts.
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin-only until real payment verification ships');
    }
    const isValid = await this.paymentsService.verifyPayment(body.transactionId, body.provider);
    if (!isValid) throw new ForbiddenException('Payment verification failed');

    return this.walletService.deposit(userId, body.amount, 'CUSTOMER', body.currency ?? 'AFN', body.transactionId, {
      description: `Wallet top-up via ${body.provider} (admin-verified)`,
      transactionType: 'DEPOSIT',
    });
  }
}
