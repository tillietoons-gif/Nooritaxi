import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CMSService {
  constructor(private prisma: PrismaService) {}

  async getPages() {
    return this.prisma.contentItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    });
  }

  async getPage(slug: string) {
    const page = await this.prisma.contentItem.findUnique({
      where: { slug },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async createPage(data: any, authorId: string) {
    return this.prisma.contentItem.create({
      data: {
        slug: data.slug,
        title: data.title,
        body: data.body,
        type: data.type,
        locale: data.locale || 'en',
        isPublished: data.isPublished ?? false,
        authorId,
      },
    });
  }

  async updatePage(slug: string, data: any) {
    return this.prisma.contentItem.update({
      where: { slug },
      data,
    });
  }
}
