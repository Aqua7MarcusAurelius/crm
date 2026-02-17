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

  async createMany(clients: any[], userId: string) {
    const results = { created: 0, errors: [] as string[] };

    for (let i = 0; i < clients.length; i++) {
      try {
        const row = clients[i];
        if (!row.firstName || !row.lastName) {
          results.errors.push(`Строка ${i + 1}: имя и фамилия обязательны`);
          continue;
        }
        await this.prisma.client.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            status: row.status || null,
            dob: row.dob ? new Date(row.dob) : null,
            gender: row.gender || null,
            country: row.country || null,
            city: row.city || null,
            address: row.address || null,
            email: row.email || null,
            mobile: row.mobile || null,
            instagram: row.instagram || null,
            whatsapp: row.whatsapp || null,
            zoom: row.zoom || null,
            tgUsername: row.tgUsername || null,
            tgUserId: row.tgUserId || null,
            tgBio: row.tgBio || null,
            tgLastVisitStatus: row.tgLastVisitStatus || null,
            tgPremiumAccount:
              row.tgPremiumAccount === 'true' || row.tgPremiumAccount === true,
            tgGifts: row.tgGifts || null,
            tgAccountTechStatus: row.tgAccountTechStatus || null,
            bio: row.bio || null,
            addInfo: row.addInfo || null,
            createdBy: userId,
          },
        });
        results.created++;
      } catch (err: any) {
        results.errors.push(`Строка ${i + 1}: ${err.message}`);
      }
    }

    return results;
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