import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getClients(search?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { tgUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      include: { creator: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClient(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });
    if (!client) throw new NotFoundException('Клиент не найден');
    return client;
  }

  async createClient(data: any, userId: string) {
    return this.prisma.client.create({
      data: { ...data, createdBy: userId },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });
  }

  async updateClient(id: string, data: any) {
    await this.getClient(id);
    return this.prisma.client.update({
      where: { id },
      data,
      include: { creator: { select: { firstName: true, lastName: true } } },
    });
  }

  async deleteClient(id: string) {
    await this.getClient(id);
    return this.prisma.client.delete({ where: { id } });
  }
}