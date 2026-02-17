import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreateClientSchema, UpdateClientSchema } from './dto/client.dto';
import type { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @RequirePermissions('clients.view')
  getClients(@Query('search') search?: string) {
    return this.clientsService.getClients(search);
  }

  @Get(':id')
  @RequirePermissions('clients.view')
  getClient(@Param('id') id: string) {
    return this.clientsService.getClient(id);
  }

  @Post()
  @RequirePermissions('clients.create')
  @UsePipes(new ZodValidationPipe(CreateClientSchema))
  createClient(@Body() body: CreateClientDto, @CurrentUser() user: any) {
    return this.clientsService.createClient(body, user.id);
  }

  @Post('bulk')
  @RequirePermissions('clients.create')
  createMany(@Body() body: { clients: any[] }, @CurrentUser() user: any) {
    return this.clientsService.createMany(body.clients, user.id);
  }

  @Patch(':id')
  @RequirePermissions('clients.edit')
  updateClient(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateClientSchema)) body: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(id, body);
  }

  @Delete(':id')
  @RequirePermissions('clients.delete')
  deleteClient(@Param('id') id: string) {
    return this.clientsService.deleteClient(id);
  }
}
