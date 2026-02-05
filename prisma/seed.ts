import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // 1. Crear roles del sistema
  console.log('📋 Creando roles...');
  const roles = await prisma.role.createMany({
    data: [
      {
        code: 'SYSTEM_ADMIN',
        description: 'Administrador del sistema (solo puede haber uno)',
      },
      {
        code: 'SUPPORT_AGENT',
        description: 'Agente de soporte técnico',
      },
      {
        code: 'REQUESTOR',
        description: 'Solicitante de servicios',
      },
      {
        code: 'AUTHORIZER',
        description: 'Autorizador de solicitudes',
      },
      {
        code: 'PAYMENT_EXECUTOR',
        description: 'Ejecutor de pagos',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${roles.count} roles creados`);

  // 2. Crear departamentos
  console.log('🏢 Creando departamentos...');
  const departments = await prisma.department.createMany({
    data: [
      {
        name: 'Gerencia General',
        description: 'Área de dirección general',
      },
      {
        name: 'Tecnología',
        description: 'Departamento de TI',
      },
      {
        name: 'Finanzas',
        description: 'Área de contabilidad y tesorería',
      },
      {
        name: 'Recursos Humanos',
        description: 'Gestión de personal',
      },
      {
        name: 'Operaciones',
        description: 'Área operativa',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${departments.count} departamentos creados`);

  // 3. Crear posiciones
  console.log('👔 Creando posiciones...');
  const positions = await prisma.position.createMany({
    data: [
      {
        name: 'Director General',
        hierarchyLevel: 1,
        description: 'Máximo ejecutivo',
      },
      {
        name: 'Gerente de Departamento',
        hierarchyLevel: 2,
        description: 'Responsable de un área',
      },
      {
        name: 'Especialista',
        hierarchyLevel: 3,
        description: 'Personal especializado',
      },
      {
        name: 'Técnico',
        hierarchyLevel: 4,
        description: 'Personal técnico',
      },
      {
        name: 'Asistente',
        hierarchyLevel: 5,
        description: 'Personal de apoyo',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${positions.count} posiciones creadas`);

  // 4. Crear sistemas
  console.log('🖥️  Creando sistemas...');
  const systems = await prisma.system.createMany({
    data: [
      {
        code: 'SISTEMA_1',
        name: 'Sistema de Contabilidad',
        active: true,
      },
      {
        code: 'SISTEMA_2',
        name: 'Sistema de Recursos Humanos',
        active: true,
      },
      {
        code: 'SISTEMA_3',
        name: 'Sistema de Tesorería',
        active: true,
      },
      {
        code: 'SISTEMA_4',
        name: 'Sistema de Nómina',
        active: true,
      },
      {
        code: 'SISTEMA_5',
        name: 'Sistema de Presupuestos',
        active: true,
      },
      {
        code: 'SISTEMA_6',
        name: 'Sistema de Control de Activos',
        active: true,
      },
      {
        code: 'SISTEMA_7',
        name: 'Portal de Trámites',
        active: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${systems.count} sistemas creados`);

  // 5. Crear usuario SYSTEM_ADMIN de prueba
  console.log('👨‍💼 Creando usuario SYSTEM_ADMIN de prueba...');

  // Obtener IDs necesarios
  const adminRole = await prisma.role.findUnique({
    where: { code: 'SYSTEM_ADMIN' },
  });

  const techDept = await prisma.department.findFirst({
    where: { name: 'Tecnología' },
  });

  const directorPos = await prisma.position.findFirst({
    where: { name: 'Director General' },
  });

  if (adminRole && techDept && directorPos) {
    const passwordHash = await argon2.hash('Admin@123456');

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@loginglobal.com',
        passwordHash,
        phone: '+1234567890',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'Administrador',
            lastName: 'Sistema',
            birthDate: new Date('1990-01-01'),
            hireDate: new Date(),
            departmentId: techDept.id,
            positionId: directorPos.id,
            photoUrl: 'https://via.placeholder.com/150',
          },
        },
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    console.log(`✅ Usuario SYSTEM_ADMIN creado: ${adminUser.email}`);
    console.log(`   Contraseña de prueba: Admin@123456`);
    console.log('   ⚠️  CAMBIAR INMEDIATAMENTE EN PRODUCCIÓN');
  }

  // 6. Crear usuario de prueba SUPPORT_AGENT
  console.log('👨‍💻 Creando usuario SUPPORT_AGENT de prueba...');

  const supportRole = await prisma.role.findUnique({
    where: { code: 'SUPPORT_AGENT' },
  });

  const techPos = await prisma.position.findFirst({
    where: { name: 'Técnico' },
  });

  if (supportRole && techDept && techPos) {
    const passwordHash = await argon2.hash('Support@123456');

    const supportUser = await prisma.user.create({
      data: {
        email: 'support@loginglobal.com',
        passwordHash,
        phone: '+1234567891',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'Soporte',
            lastName: 'Técnico',
            birthDate: new Date('1995-06-15'),
            hireDate: new Date(),
            departmentId: techDept.id,
            positionId: techPos.id,
            photoUrl: 'https://via.placeholder.com/150',
          },
        },
        roles: {
          create: {
            roleId: supportRole.id,
          },
        },
      },
    });

    console.log(`✅ Usuario SUPPORT_AGENT creado: ${supportUser.email}`);
    console.log(`   Contraseña de prueba: Support@123456`);
  }

  console.log('✨ ¡Seed completado exitosamente!');
  console.log('\n📚 Próximos pasos:');
  console.log('1. Generar claves RSA256: ./keys/private.pem y public.pem');
  console.log('2. Configurar variables de entorno en .env');
  console.log('3. Ejecutar: npm run start:dev');
  console.log('\n🔐 Usuarios de prueba:');
  console.log('   - admin@loginglobal.com / Admin@123456');
  console.log('   - support@loginglobal.com / Support@123456');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

