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
import { AdminTrackingModule } from './admin-tracking/admin-tracking.module';
import { KycModule } from './kyc/kyc.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { DriverTiersModule } from './driver-tiers/driver-tiers.module';
import { RolesModule } from './roles/roles.module';
import { FleetsModule } from './fleets/fleets.module';
import { FinanceModule } from './finance/finance.module';
import { FraudModule } from './fraud/fraud.module';
import { OperationsModule } from './operations/operations.module';
import { CorporateModule } from './corporate/corporate.module';
import { AirportModule } from './airport/airport.module';

import { SupportModule } from './support/support.module';
import { MarketingModule } from './marketing/marketing.module';

import { CMSModule } from './cms/cms.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { VehiclesModule } from './vehicles/vehicles.module';

import { NotificationsModule } from './notifications/notifications.module';
import { AIModule } from './ai/ai.module';
import { PlacesModule } from './places/places.module';

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
    AdminTrackingModule,
    KycModule,
    LoyaltyModule,
    DriverTiersModule,
    RolesModule,
    FleetsModule,
    FinanceModule,
    FraudModule,
    OperationsModule,
    CorporateModule,
    AirportModule,
    SupportModule,
    MarketingModule,
    CMSModule,
    SubscriptionsModule,
    VehiclesModule,
    NotificationsModule,
    AIModule,
    PlacesModule,
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
