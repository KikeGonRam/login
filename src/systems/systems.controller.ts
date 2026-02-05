import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SystemsService } from './systems.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

class CreateSystemDto {
  code: string;
  name: string;
}

class AssignSystemDto {
  userId: string;
  systemCode: string;
}

@Controller('systems')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemsController {
  constructor(private systemsService: SystemsService) {}

  /**
   * GET /systems
   * Lista todos los sistemas
   */
  @Get()
  @Roles('SYSTEM_ADMIN')
  async findAll() {
    return this.systemsService.findAll();
  }

  /**
   * POST /systems
   * Crea un nuevo sistema
   */
  @Post()
  @Roles('SYSTEM_ADMIN')
  async create(@Body() dto: CreateSystemDto) {
    return this.systemsService.create(dto.code, dto.name);
  }

  /**
   * POST /systems/assign
   * Asigna acceso a un sistema para un usuario
   */
  @Post('assign')
  @Roles('SYSTEM_ADMIN')
  async assignAccess(@Body() dto: AssignSystemDto) {
    return this.systemsService.assignUserAccess(dto.userId, dto.systemCode);
  }

  /**
   * DELETE /systems/assign/:userId/:systemCode
   * Remueve acceso a un sistema para un usuario
   */
  @Delete('assign/:userId/:systemCode')
  @Roles('SYSTEM_ADMIN')
  async removeAccess(
    @Param('userId') userId: string,
    @Param('systemCode') systemCode: string,
  ) {
    return this.systemsService.removeUserAccess(userId, systemCode);
  }

  /**
   * GET /systems/user/:userId
   * Obtiene los sistemas a los que tiene acceso un usuario
   */
  @Get('user/:userId')
  @Roles('SYSTEM_ADMIN')
  async getUserSystems(@Param('userId') userId: string) {
    return this.systemsService.getUserSystems(userId);
  }
}
