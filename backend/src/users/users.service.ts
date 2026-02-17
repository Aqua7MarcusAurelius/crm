import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import type { UpdateUserDto } from './dto/update-user.dto';

// Все поля кроме password — используем во всех запросах
const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  phone: true,
  telegram: true,
  isAdmin: true,
  status: true,
  projectId: true,
  positionId: true,
  emailId: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
      select: {
        ...userSelect,
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
      select: {
        ...userSelect,
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
      select: userSelect,
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
      select: userSelect,
    });
  }

  async blockUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('Нельзя заблокировать самого себя');
    }
    await this.getUser(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' },
      select: userSelect,
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
      select: userSelect,
    });
  }

  async updateUser(userId: string, data: UpdateUserDto, currentUserId: string) {
    await this.getUser(userId);

    // Нельзя снять админку с самого себя
    if (userId === currentUserId && data.isAdmin === false) {
      throw new BadRequestException('Нельзя снять права администратора с самого себя');
    }

    // Транзакция: email назначение/освобождение + обновление юзера
    return this.prisma.$transaction(async (tx) => {
      // Получаем текущего юзера внутри транзакции
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { emailId: true },
      });

      // Если email меняется
      const emailChanging = data.emailId !== undefined &&
        data.emailId !== currentUser?.emailId;

      if (emailChanging) {
        // Освобождаем старый email
        if (currentUser?.emailId) {
          await tx.corporateEmail.update({
            where: { id: currentUser.emailId },
            data: { status: 'AVAILABLE' },
          });
        }

        // Назначаем новый email (если не null)
        if (data.emailId) {
          const corpEmail = await tx.corporateEmail.findUnique({
            where: { id: data.emailId },
          });
          if (!corpEmail || corpEmail.status !== 'AVAILABLE') {
            throw new BadRequestException('Email недоступен');
          }
          await tx.corporateEmail.update({
            where: { id: data.emailId },
            data: { status: 'ASSIGNED' },
          });
        }
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          projectId: data.projectId,
          positionId: data.positionId,
          emailId: data.emailId,
          isAdmin: data.isAdmin,
        },
        select: {
          ...userSelect,
          project: true,
          position: true,
          email: true,
        },
      });
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
