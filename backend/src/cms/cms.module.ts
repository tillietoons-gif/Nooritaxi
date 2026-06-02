import { Module } from '@nestjs/common';
import { CMSService } from './cms.service';
import { CMSController } from './cms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CMSController],
  providers: [CMSService],
  exports: [CMSService]
})
export class CMSModule {}
