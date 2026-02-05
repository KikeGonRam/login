import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import type { CreateUserDto, UpdateProfileDto } from './users.service';
import { ActivateUserDto } from './dto/activate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * POST /users/activate
   * Activa un usuario con token de un solo uso + contraseña
   *
   * NO REQUIERE AUTENTICACIÓN
   *
   * Flujo de activación:
   * 1. Usuario recibe correo con link: login.com/activate?token=xxx
   * 2. Usuario entra contraseña segura
   * 3. POST /users/activate { token, password }
   * 4. Sistema valida token (no expirado, no usado)
   * 5. Sistema crea contraseña con Argon2
   * 6. Usuario pasa a ACTIVE
   * 7. Auditoría registra evento
   * 8. Usuario puede iniciar sesión
   */
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Body() dto: ActivateUserDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.usersService.activate(dto.token, dto.password, ip);
  }

  /**
   * POST /users
   * Crea un nuevo usuario en estado PENDING_ACTIVATION
   * Requiere: SYSTEM_ADMIN
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const adminUser = req.user as { sub: string };
    const ip = req.ip || req.socket.remoteAddress;

    return this.usersService.create(dto, adminUser.sub, ip);
  }

  /**
   * GET /users
   * Lista todos los usuarios
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'SUPPORT_AGENT')
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * GET /users/:id
   * Obtiene un usuario por ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'SUPPORT_AGENT')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * PUT /users/:id/profile
   * Actualiza el perfil de un usuario
   */
  @Put(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const adminUser = req.user as { sub: string };
    const ip = req.ip || req.socket.remoteAddress;

    return this.usersService.updateProfile(id, dto, adminUser.sub, ip);
  }

  /**
   * PUT /users/:id/disable
   * Deshabilita un usuario
   */
  @Put(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  async disable(@Param('id') id: string, @Req() req: Request) {
    const adminUser = req.user as { sub: string };
    const ip = req.ip || req.socket.remoteAddress;

    return this.usersService.disable(id, adminUser.sub, ip);
  }
}
