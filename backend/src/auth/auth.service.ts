import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const phone = dto.phone.trim();
    const telegram = dto.telegram?.trim() || null;

    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new ConflictException('Этот ник уже занят');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        password: hashedPassword,
        phone,
        telegram,
      },
    });

    return {
      message: 'Заявка отправлена. Ожидайте одобрения администратором.',
      userId: user.id,
    };
  }

  async login(dto: LoginDto) {
    const login = dto.login.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: login },
          { email: { email: login } },
        ],
      },
      include: {
        email: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (user.status === 'PENDING') {
      throw new ForbiddenException('Заявка ещё не одобрена');
    }

    if (user.status === 'REJECTED') {
      throw new ForbiddenException('Заявка отклонена');
    }

    if (user.status === 'BLOCKED') {
      throw new ForbiddenException('Аккаунт заблокирован');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const payload = { sub: user.id, username: user.username };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        email: user.email?.email ?? null,
        permissions: user.permissions.map((p) => p.permission.code),
      },
    };
  }
}