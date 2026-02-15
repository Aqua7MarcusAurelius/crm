import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(status?: UserStatus, search?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { telegram: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      include: {
        project: true,
        position: true,
        email: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        project: true,
        position: true,
        email: true,
        permissions: { include: { permission: true } },
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async approveUser(userId: string) {
    const user = await this.getUser(userId);
    if (user.status !== 'PENDING') {
      throw new BadRequestException('Можно одобрить только заявку со статусом PENDING');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });
  }

  async rejectUser(userId: string) {
    const user = await this.getUser(userId);
    if (user.status !== 'PENDING') {
      throw new BadRequestException('Можно отклонить только заявку со статусом PENDING');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'REJECTED' },
    });
  }

  async blockUser(userId: string) {
    await this.getUser(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' },
    });
  }

  async activateUser(userId: string) {
    const user = await this.getUser(userId);
    if (user.status === 'ACTIVE') {
      throw new BadRequestException('Пользователь уже активен');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });
  }

  async updateUser(userId: string, data: {
    projectId?: string | null;
    positionId?: string | null;
    emailId?: string | null;
    isAdmin?: boolean;
  }) {
    await this.getUser(userId);

    if (data.emailId) {
      const corpEmail = await this.prisma.corporateEmail.findUnique({
        where: { id: data.emailId },
      });
      if (!corpEmail || corpEmail.status !== 'AVAILABLE') {
        throw new BadRequestException('Email недоступен');
      }

      // Освобождаем старый email если был
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (currentUser?.emailId) {
        await this.prisma.corporateEmail.update({
          where: { id: currentUser.emailId },
          data: { status: 'AVAILABLE' },
        });
      }

      await this.prisma.corporateEmail.update({
        where: { id: data.emailId },
        data: { status: 'ASSIGNED' },
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        projectId: data.projectId,
        positionId: data.positionId,
        emailId: data.emailId,
        isAdmin: data.isAdmin,
      },
      include: {
        project: true,
        position: true,
        email: true,
      },
    });
  }

  // ─── Справочники ───

  async getProjects() {
    return this.prisma.project.findMany({
      include: { positions: true },
      orderBy: { name: 'asc' },
    });
  }

  async createProject(name: string) {
    return this.prisma.project.create({ data: { name } });
  }

  async createPosition(name: string, projectId: string) {
    return this.prisma.position.create({
      data: { name, projectId },
    });
  }

  async getAvailableEmails() {
    return this.prisma.corporateEmail.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { email: 'asc' },
    });
  }

  async addEmails(emails: string[]) {
    return this.prisma.corporateEmail.createMany({
      data: emails.map((email) => ({ email })),
      skipDuplicates: true,
    });
  }
}