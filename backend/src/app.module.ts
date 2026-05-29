import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { WalletModule } from './wallet/wallet.module';
import { TrackingGateway } from './tracking.gateway';
import { SuperAppModule } from './super-app/super-app.module';
import { WsJwtGuard } from './auth/ws-jwt.guard';
import { FoodModule } from './food/food.module';
import { LogisticsModule } from './logistics/logistics.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { PaymentsModule } from './payments/payments.module';
import { SafetyModule } from './safety/safety.module';
import { AdminModule } from './admin/admin.module';
import { SurgeModule } from './surge/surge.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TripsModule,
    WalletModule,
    SuperAppModule,
    FoodModule,
    LogisticsModule,
    ReviewsModule,
    DispatchModule,
    PaymentsModule,
    SafetyModule,
    AdminModule,
    SurgeModule,
  ],
  providers: [
    AppService,
    TrackingGateway,
    WsJwtGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
