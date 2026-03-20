import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos de /uploads
  // Usar process.cwd() para que funcione tanto en desarrollo como en producción
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Habilitar CORS configurado para producción
  const corsOrigin = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : true; // En desarrollo permite todos los orígenes

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Prefijo global para todas las rutas de la API
  app.setGlobalPrefix('api');

  // Habilitar validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true, // Transforma automáticamente los tipos
      disableErrorMessages: false, // Mostrar mensajes de error detallados
    }),
  );

  // Configuración de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('EnrutApp API')
    .setDescription(
      'API REST para el sistema de gestión de transporte EnrutApp. Incluye autenticación JWT, gestión de usuarios, roles, rutas, vehículos, conductores, reservas y más.',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints de autenticación y autorización')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag('Roles', 'Gestión de roles y permisos')
    .addTag('Ciudades', 'Catálogo de ciudades')
    .addTag('Rutas', 'Gestión de rutas de transporte')
    .addTag('Vehículos', 'Gestión de vehículos')
    .addTag('Conductores', 'Gestión de conductores')
    .addTag('Reservas', 'Gestión de reservas de pasajeros')
    .addTag('Encomiendas', 'Gestión de encomiendas')
    .addTag('Turnos', 'Gestión de turnos de trabajo')
    .addTag('Finanzas', 'Módulo de finanzas y reportes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description:
          'Ingrese el token JWT obtenido del endpoint /api/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'EnrutApp API - Documentación',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;
  // Escuchar en 0.0.0.0 para permitir conexiones desde dispositivos móviles en la red local
  const host = '0.0.0.0';
  await app.listen(port, host);

  // Mensajes informativos en consola con colores
  const serverUrl = `http://localhost:${port}`;
  const apiUrl = `${serverUrl}/api`;
  const docsUrl = `${serverUrl}/api/docs`;
  const uploadsUrl = `${serverUrl}/uploads`;

  console.log('\n');
  console.log('==========================================');
  console.log('🚀 EnrutApp Backend - Servidor Iniciado 🚀');
  console.log('==========================================');
  console.log('\n');

  console.log('📍 URLs del Servidor:');
  console.log(`   ➜ Local:           ${serverUrl}`);
  console.log(`   ➜ API Base:        ${apiUrl}`);
  console.log(`   ➜ Swagger Docs:    ${docsUrl}`);
  console.log(`   ➜ Archivos:        ${uploadsUrl}`);

  console.log('\n');
  console.log('⚙️ Configuración:');
  console.log('   ✓ Autenticación:   JWT Bearer Token');
  console.log('   ✓ Validación:      class-validator (Global)');
  console.log('   ✓ CORS:            Habilitado (todos los orígenes)');
  console.log('   ✓ Prefijo API:     /api');
  console.log('   ✓ WebSocket:       Socket.io /tracking');

  console.log('\n');
  console.log('📋 Endpoints Principales:');
  console.log('   Auth:');
  console.log('   • POST   /api/auth/login           - Iniciar sesión');
  console.log('   • POST   /api/auth/register        - Registrar usuario');
  console.log('   • GET    /api/auth/profile         - Perfil (🔒 JWT)');
  console.log('\n   Recursos:');
  console.log(
    '   • GET    /api/usuarios             - Listar usuarios (🔒 JWT)',
  );
  console.log('   • GET    /api/roles                - Listar roles');
  console.log('   • GET    /api/ciudades             - Catálogo de ciudades');
  console.log('\n');
  console.log(
    `💡 Tip: Abre ${docsUrl} para ver la documentación de swagger completa`,
  );
  console.log(
    '🔑 Nota: Usa el botón "Authorize" en Swagger para autenticarte con JWT',
  );

  console.log('\n');
  console.log('📊 Estado: ✓ Listo para recibir peticiones');
  console.log('==========================================\n');
}

void bootstrap();
