import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { CreateTrustedContactInput, RaiseSosInput } from './safety.service';
import { SafetyService } from './safety.service';

@Controller()
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  // ---------- Trusted contacts ----------

  @Get('safety/contacts')
  @UseGuards(JwtAuthGuard)
  listContacts(@CurrentUser('id') userId: string) {
    return this.safety.listContacts(userId);
  }

  @Post('safety/contacts')
  @UseGuards(JwtAuthGuard)
  addContact(@CurrentUser('id') userId: string, @Body() body: CreateTrustedContactInput) {
    return this.safety.addContact(userId, body);
  }

  @Delete('safety/contacts/:contactId')
  @UseGuards(JwtAuthGuard)
  removeContact(@CurrentUser('id') userId: string, @Param('contactId') contactId: string) {
    return this.safety.removeContact(userId, contactId);
  }

  // ---------- SOS ----------

  @Post('safety/sos')
  @UseGuards(JwtAuthGuard)
  raiseSos(@CurrentUser('id') userId: string, @Body() body: RaiseSosInput) {
    return this.safety.raiseSos(userId, body);
  }

  @Patch('safety/sos/:alertId/resolve')
  @UseGuards(JwtAuthGuard)
  resolveSos(
    @Param('alertId') alertId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    if (!user?.id) throw new ForbiddenException('Not authenticated');
    const isStaff = user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT;
    return this.safety.resolveSos(alertId, user.id, isStaff);
  }

  @Get('admin/sos/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  listActiveSosAlerts() {
    return this.safety.listActiveSosAlerts();
  }

  // ---------- Public trip-share (no auth) ----------

  @Get('trips/share/:safetyCode')
  publicTripByCode(@Param('safetyCode') safetyCode: string) {
    return this.safety.getPublicTripByCode(safetyCode);
  }
}
