import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsAdminGuard } from './is-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UpdateUserSchema } from './dto/update-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { CreateProjectSchema, CreatePositionSchema, AddEmailsSchema } from './dto/references.dto';
import type { CreateProjectDto, CreatePositionDto, AddEmailsDto } from './dto/references.dto';
import { UserStatus } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, IsAdminGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUsers(
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.usersService.getUsers(status, search);
  }

  @Get('projects')
  getProjects() {
    return this.usersService.getProjects();
  }

  @Get('emails/available')
  getAvailableEmails() {
    return this.usersService.getAvailableEmails();
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Patch(':id/approve')
  approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/reject')
  rejectUser(@Param('id') id: string) {
    return this.usersService.rejectUser(id);
  }

  @Patch(':id/block')
  blockUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.blockUser(id, user.id);
  }

  @Patch(':id/activate')
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateUser(id, body, user.id);
  }

  @Post('projects')
  @UsePipes(new ZodValidationPipe(CreateProjectSchema))
  createProject(@Body() body: CreateProjectDto) {
    return this.usersService.createProject(body.name);
  }

  @Post('positions')
  @UsePipes(new ZodValidationPipe(CreatePositionSchema))
  createPosition(@Body() body: CreatePositionDto) {
    return this.usersService.createPosition(body.name, body.projectId);
  }

  @Post('emails')
  @UsePipes(new ZodValidationPipe(AddEmailsSchema))
  addEmails(@Body() body: AddEmailsDto) {
    return this.usersService.addEmails(body.emails);
  }
}
