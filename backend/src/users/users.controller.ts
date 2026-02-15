import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsAdminGuard } from './is-admin.guard';
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
  blockUser(@Param('id') id: string) {
    return this.usersService.blockUser(id);
  }

  @Patch(':id/activate')
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUser(id, body);
  }

  @Post('projects')
  createProject(@Body('name') name: string) {
    return this.usersService.createProject(name);
  }

  @Post('positions')
  createPosition(@Body() body: { name: string; projectId: string }) {
    return this.usersService.createPosition(body.name, body.projectId);
  }

  @Post('emails')
  addEmails(@Body('emails') emails: string[]) {
    return this.usersService.addEmails(emails);
  }
}