import { PrismaClient, TipoDocumento } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Crear Roles
  const roles = [
    { nombreRol: 'Administrador', descripcion: 'Rol con acceso total al sistema' },
    { nombreRol: 'Conductor', descripcion: 'Personal que maneja los vehículos' },
    { nombreRol: 'Cliente', descripcion: 'Usuario que compra pasajes o envía encomiendas' },
  ];

  const createdRoles: Array<any> = [];
  for (const rol of roles) {
    const existingRole = await prisma.roles.findUnique({
      where: { nombreRol: rol.nombreRol },
    });

    if (!existingRole) {
      const created = await prisma.roles.create({
        data: {
          idRol: uuidv4(),
          nombreRol: rol.nombreRol,
          descripcion: rol.descripcion,
          estado: true,
        },
      });
      createdRoles.push(created);
      console.log(`Role created: ${rol.nombreRol}`);
    } else {
      createdRoles.push(existingRole);
      console.log(`Role already exists: ${rol.nombreRol}`);
    }
  }

  // 2. Crear Ciudades básicas
  const ciudadesNombres = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'];
  const createdCiudades: Array<any> = [];
  for (const nombre of ciudadesNombres) {
    const existingCiudad = await prisma.ciudades.findUnique({
      where: { nombreCiudad: nombre },
    });

    if (!existingCiudad) {
      const created = await prisma.ciudades.create({
        data: { nombreCiudad: nombre },
      });
      createdCiudades.push(created);
      console.log(`City created: ${nombre}`);
    } else {
      createdCiudades.push(existingCiudad);
      console.log(`City already exists: ${nombre}`);
    }
  }

  // 3. Crear Usuario Administrador
  const adminEmail = 'haderrenteria13az@gmail.com';
  const adminPassword = 'H@der1302';

  const existingAdmin = await prisma.usuarios.findUnique({
    where: { correo: adminEmail },
  });

  if (!existingAdmin) {
    const adminRole = createdRoles.find((r) => r.nombreRol === 'Administrador');
    if (adminRole) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await prisma.usuarios.create({
        data: {
          idUsuario: uuidv4(),
          idRol: adminRole.idRol,
          nombre: 'Administrador Principal',
          correo: adminEmail,
          contrasena: hashedPassword,
          tipoDoc: TipoDocumento.CC,
          numDocumento: '1021805422',
          telefono: '3216636109',
          idCiudad: createdCiudades.length > 0 ? createdCiudades[0].idCiudad : null,
          estado: true,
          perfilCompleto: true,
        },
      });
      console.log(`Admin user created: ${adminEmail} (password: ${adminPassword})`);
    } else {
      console.error('Could not find Administrator role to create admin user.');
    }
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
