import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

class CreateRoleDto {
  code: string;
  description?: string;
}

class AssignRoleDto {
  userId: string;
  roleCode: string;
}

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  /**
   * GET /roles
   * Lista todos los roles
   */
  @Get()
  @Roles('SYSTEM_ADMIN')
  async findAll() {
    return this.rolesService.findAll();
  }

  /**
   * POST /roles
   * Crea un nuevo rol
   */
  @Post()
  @Roles('SYSTEM_ADMIN')
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto.code, dto.description);
  }

  /**
   * POST /roles/assign
   * Asigna un rol a un usuario
   */
  @Post('assign')
  @Roles('SYSTEM_ADMIN')
  async assignRole(@Body() dto: AssignRoleDto, @Req() req: Request) {
    const adminUser = req.user as { sub: string };
    const ip = req.ip || req.socket.remoteAddress;

    return this.rolesService.assignRole(
      dto.userId,
      dto.roleCode,
      adminUser.sub,
      ip,
    );
  }

  /**
   * DELETE /roles/assign/:userId/:roleCode
   * Remueve un rol de un usuario
   */
  @Delete('assign/:userId/:roleCode')
  @Roles('SYSTEM_ADMIN')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleCode') roleCode: string,
    @Req() req: Request,
  ) {
    const adminUser = req.user as { sub: string };
    const ip = req.ip || req.socket.remoteAddress;

    return this.rolesService.removeRole(userId, roleCode, adminUser.sub, ip);
  }

  /**
   * GET /roles/user/:userId
   * Obtiene los roles de un usuario
   */
  @Get('user/:userId')
  @Roles('SYSTEM_ADMIN')
  async getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }
}
