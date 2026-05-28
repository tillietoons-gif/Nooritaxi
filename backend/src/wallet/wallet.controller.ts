import { Body, Controller, ForbiddenException, Get, Param, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

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
  deposit(@Param('userId') userId: string, @Body() body: any, @CurrentUser() user: any) {
    const canDeposit = user?.id === userId || [UserRole.ADMIN, UserRole.SUPPORT].includes(user?.role);
    if (!canDeposit) throw new ForbiddenException('Cannot top up another user wallet');
    return this.walletService.deposit(userId, Number(body.amount), body.type, body.currency, body.idempotencyKey, {
      description: body.description,
    });
  }

  @Post(':userId/debit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  debit(@Param('userId') userId: string, @Body() body: any) {
    return this.walletService.transfer(userId, Number(body.amount), body.description, body.idempotencyKey);
  }
}
