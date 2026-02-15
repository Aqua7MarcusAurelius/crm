import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSchema, RegisterDto } from './dto/register.dto';
import { LoginSchema, LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const data = RegisterSchema.parse(dto);

    const existing = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new ConflictException('Этот ник уже занят');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        password: hashedPassword,
        phone: data.phone,
        telegram: data.telegram,
      },
    });

    return {
      message: 'Заявка отправлена. Ожидайте одобрения администратором.',
      userId: user.id,
    };
  }

  async login(dto: LoginDto) {
    const data = LoginSchema.parse(dto);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: data.login },
          { email: { email: data.login } },
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

    const passwordValid = await bcrypt.compare(data.password, user.password);

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