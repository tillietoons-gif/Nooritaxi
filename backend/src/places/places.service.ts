import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type PlaceInput = {
  name?: string;
  address?: string;
  city?: string;
  category?: string;
  aliases?: string[] | string;
  lat?: number | string;
  lng?: number | string;
  priority?: number | string;
  isActive?: boolean;
  createdById?: string;
};

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  searchPlaces(q?: string, city?: string, limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 25);
    const query = q?.trim();
    const aliasQueries = query
      ? [...new Set([query, query.toLowerCase(), query.toUpperCase()])]
      : [];
    const where: Prisma.CustomPlaceWhereInput = {
      isActive: true,
      ...(city?.trim()
        ? { city: { equals: city.trim(), mode: 'insensitive' } }
        : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { address: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
              ...aliasQueries.map((alias) => ({ aliases: { has: alias } })),
            ],
          }
        : {}),
    };

    return this.prisma.customPlace.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      take: safeLimit,
    });
  }

  listAdminPlaces() {
    return this.prisma.customPlace.findMany({
      orderBy: [{ isActive: 'desc' }, { priority: 'desc' }, { name: 'asc' }],
    });
  }

  createPlace(input: PlaceInput) {
    const data = this.validatePlace(input, true);
    return this.prisma.customPlace.create({ data });
  }

  async updatePlace(id: string, input: PlaceInput) {
    const existing = await this.prisma.customPlace.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Place not found');

    const data = this.validatePlace(input, false);
    return this.prisma.customPlace.update({
      where: { id },
      data,
    });
  }

  async deactivatePlace(id: string) {
    const existing = await this.prisma.customPlace.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Place not found');
    return this.prisma.customPlace.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private validatePlace(input: PlaceInput, requireAll: boolean) {
    const data: Prisma.CustomPlaceUncheckedCreateInput =
      {} as Prisma.CustomPlaceUncheckedCreateInput;

    if (requireAll || input.name != null) {
      const name = String(input.name ?? '').trim();
      if (!name) throw new BadRequestException('Place name is required');
      data.name = name;
    }

    if (requireAll || input.address != null) {
      const address = String(input.address ?? '').trim();
      if (!address) throw new BadRequestException('Place address is required');
      data.address = address;
    }

    if (input.city != null || requireAll) {
      data.city = String(input.city ?? 'Kabul').trim() || 'Kabul';
    }

    if (input.category != null) {
      data.category = String(input.category).trim() || null;
    }

    if (input.aliases != null) {
      data.aliases = this.normalizeAliases(input.aliases);
    }

    if (requireAll || input.lat != null) {
      const lat = Number(input.lat);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new BadRequestException('Valid latitude is required');
      }
      data.lat = lat;
    }

    if (requireAll || input.lng != null) {
      const lng = Number(input.lng);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new BadRequestException('Valid longitude is required');
      }
      data.lng = lng;
    }

    if (input.priority != null) {
      const priority = Number(input.priority);
      if (!Number.isFinite(priority)) {
        throw new BadRequestException('Priority must be a number');
      }
      data.priority = Math.trunc(priority);
    }

    if (typeof input.isActive === 'boolean') data.isActive = input.isActive;
    if (input.createdById) data.createdById = input.createdById;

    return data;
  }

  private normalizeAliases(input: string[] | string) {
    const aliases = Array.isArray(input) ? input : input.split(',');
    return [...new Set(aliases.map((alias) => alias.trim()).filter(Boolean))];
  }
}
