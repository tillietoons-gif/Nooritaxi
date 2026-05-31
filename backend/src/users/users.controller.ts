import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { DocumentStatus, DocumentType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post(':driverId/documents')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  uploadKycDocument(
    @Param('driverId') driverId: string,
    @Body() body: { type: DocumentType; url: string },
  ) {
    return this.usersService.uploadKycDocument(driverId, body.type, body.url);
  }

  @Get('admin/documents/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  listPendingKycDocuments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.listPendingKycDocuments(
      Number(page ?? 1),
      Number(limit ?? 25),
    );
  }

  @Patch('admin/documents/:documentId/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  verifyKycDocument(
    @Param('documentId') documentId: string,
    @Body() body: { status: DocumentStatus },
    @CurrentUser() user: any,
  ) {
    return this.usersService.verifyKycDocument(
      documentId,
      body.status,
      user.id,
    );
  }
}
