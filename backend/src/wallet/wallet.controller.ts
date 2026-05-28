import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get(':userId')
  getBalance(@Param('userId') userId: string, @Query('type') type?: string, @Query('currency') currency?: string) {
    return this.walletService.getBalance(userId, type, currency);
  }

  @Post(':userId/deposit')
  deposit(@Param('userId') userId: string, @Body() body: any) {
    return this.walletService.deposit(userId, Number(body.amount), body.type, body.currency);
  }

  @Post(':userId/debit')
  debit(@Param('userId') userId: string, @Body() body: any) {
    return this.walletService.transfer(userId, Number(body.amount), body.description);
  }
}
