import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async findOne(phone: string): Promise<User | null> { return this.prisma.user.findUnique({ where: { phone } }); }
  async create(data: any): Promise<User> { return this.prisma.user.create({ data }); }
  async findById(id: string): Promise<User | null> { return this.prisma.user.findUnique({ where: { id } }); }
}
