import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CMSService } from './cms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/cms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CMSController {
  constructor(private readonly cmsService: CMSService) {}

  @Get()
  @RequirePermission('cms.view')
  getPages() {
    return this.cmsService.getPages();
  }

  @Post()
  @RequirePermission('cms.edit')
  createPage(@Request() req, @Body() data: any) {
    return this.cmsService.createPage(data, req.user.userId);
  }

  @Get(':slug')
  @RequirePermission('cms.view')
  getPage(@Param('slug') slug: string) {
    return this.cmsService.getPage(slug);
  }

  @Put(':slug')
  @RequirePermission('cms.edit')
  updatePage(@Param('slug') slug: string, @Body() data: any) {
    return this.cmsService.updatePage(slug, data);
  }
}
