import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { WalletModule } from './wallet/wallet.module';
import { TrackingGateway } from './tracking.gateway';
import { SuperAppModule } from './super-app/super-app.module';
import { WsJwtGuard } from './auth/ws-jwt.guard';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, TripsModule, WalletModule, SuperAppModule],
  providers: [TrackingGateway, WsJwtGuard],
})
export class AppModule {}
