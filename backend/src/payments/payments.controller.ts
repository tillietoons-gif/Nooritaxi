import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('intent')
  createIntent(@Body() body: any, @CurrentUser() user: any) {
    return this.payments.createIntent({
      ...body,
      userId: body.userId ?? user?.userId,
    });
  }

  @Post('verify')
  verify(@Body() body: any, @CurrentUser() user: any) {
    return this.payments.verifyPayment(
      body.intentId,
      body.providerRef ?? body.transactionRef,
      user?.userId,
    );
  }

  @Get('history')
  history(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payments.listTransactions(
      user?.userId,
      Number(page ?? 1),
      Number(limit ?? 25),
    );
  }

  @Get('intent/:id')
  getIntent(@Param('id') id: string) {
    return this.payments.getIntent(id);
  }
}
