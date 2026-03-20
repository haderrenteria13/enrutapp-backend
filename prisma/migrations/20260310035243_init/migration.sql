-- CreateEnum
CREATE TYPE "TipoPlaca" AS ENUM ('Blanca', 'Amarilla');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('TI', 'CC', 'CE', 'Pasaporte');

-- CreateTable
CREATE TABLE "Usuarios" (
    "idUsuario" VARCHAR(36) NOT NULL,
    "idRol" VARCHAR(36) NOT NULL,
    "foto" TEXT,
    "tipoDoc" "TipoDocumento",
    "numDocumento" VARCHAR(20),
    "nombre" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(100) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "direccion" VARCHAR(255),
    "idCiudad" INTEGER,
    "estado" BOOLEAN NOT NULL,
    "resetPasswordCode" VARCHAR(100),
    "resetPasswordExpires" TIMESTAMP(3),
    "perfilCompleto" BOOLEAN NOT NULL DEFAULT true,
    "authProvider" VARCHAR(20) NOT NULL DEFAULT 'local',

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("idUsuario")
);

-- CreateTable
CREATE TABLE "Ciudades" (
    "idCiudad" SERIAL NOT NULL,
    "nombreCiudad" VARCHAR(100) NOT NULL,

    CONSTRAINT "Ciudades_pkey" PRIMARY KEY ("idCiudad")
);

-- CreateTable
CREATE TABLE "Roles" (
    "idRol" VARCHAR(36) NOT NULL,
    "nombreRol" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("idRol")
);

-- CreateTable
CREATE TABLE "Permisos" (
    "idPermiso" VARCHAR(36) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "codigo" VARCHAR(50) NOT NULL,

    CONSTRAINT "Permisos_pkey" PRIMARY KEY ("idPermiso")
);

-- CreateTable
CREATE TABLE "RolesPermisos" (
    "idRol" VARCHAR(36) NOT NULL,
    "idPermiso" VARCHAR(36) NOT NULL,

    CONSTRAINT "RolesPermisos_pkey" PRIMARY KEY ("idRol","idPermiso")
);

-- CreateTable
CREATE TABLE "TiposVehiculo" (
    "idTipoVehiculo" VARCHAR(36) NOT NULL,
    "nombreTipoVehiculo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiposVehiculo_pkey" PRIMARY KEY ("idTipoVehiculo")
);

-- CreateTable
CREATE TABLE "MarcasVehiculos" (
    "idMarcaVehiculo" VARCHAR(36) NOT NULL,
    "nombreMarca" VARCHAR(50) NOT NULL,
    "pais" VARCHAR(50),
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarcasVehiculos_pkey" PRIMARY KEY ("idMarcaVehiculo")
);

-- CreateTable
CREATE TABLE "Vehiculos" (
    "idVehiculo" VARCHAR(36) NOT NULL,
    "idTipoVehiculo" VARCHAR(36) NOT NULL,
    "idMarcaVehiculo" VARCHAR(36) NOT NULL,
    "idPropietario" VARCHAR(36),
    "propietarioExternoNombre" VARCHAR(100),
    "propietarioExternoDocumento" VARCHAR(20),
    "propietarioExternoTelefono" VARCHAR(20),
    "idConductorAsignado" VARCHAR(36),
    "placa" VARCHAR(10) NOT NULL,
    "tipoPlaca" "TipoPlaca" NOT NULL DEFAULT 'Blanca',
    "linea" VARCHAR(50) NOT NULL,
    "modelo" INTEGER NOT NULL,
    "color" VARCHAR(30) NOT NULL,
    "vin" VARCHAR(17),
    "fotoUrl" VARCHAR(255) NOT NULL,
    "capacidadPasajeros" INTEGER NOT NULL,
    "capacidadCarga" DECIMAL(10,2),
    "soatVencimiento" TIMESTAMP(3),
    "tecnomecanicaVencimiento" TIMESTAMP(3),
    "seguroVencimiento" TIMESTAMP(3),
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehiculos_pkey" PRIMARY KEY ("idVehiculo")
);

-- CreateTable
CREATE TABLE "Ubicaciones" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "idUbicacion" VARCHAR(36) NOT NULL,
    "nombreUbicacion" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("idUbicacion")
);

-- CreateTable
CREATE TABLE "Origen" (
    "idOrigen" VARCHAR(36) NOT NULL,
    "idUbicacion" VARCHAR(36) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "Origen_pkey" PRIMARY KEY ("idOrigen")
);

-- CreateTable
CREATE TABLE "Destino" (
    "idDestino" VARCHAR(36) NOT NULL,
    "idUbicacion" VARCHAR(36) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "Destino_pkey" PRIMARY KEY ("idDestino")
);

-- CreateTable
CREATE TABLE "Ruta" (
    "idRuta" VARCHAR(36) NOT NULL,
    "idOrigen" VARCHAR(36) NOT NULL,
    "idDestino" VARCHAR(36) NOT NULL,
    "distancia" DECIMAL(10,2),
    "observaciones" VARCHAR(100),
    "tiempoEstimado" VARCHAR(10),
    "precioBase" DECIMAL(10,2),
    "estado" VARCHAR(50),

    CONSTRAINT "Ruta_pkey" PRIMARY KEY ("idRuta")
);

-- CreateTable
CREATE TABLE "Paradas" (
    "idParada" VARCHAR(36) NOT NULL,
    "idRuta" VARCHAR(36) NOT NULL,
    "idUbicacion" VARCHAR(36) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paradas_pkey" PRIMARY KEY ("idParada")
);

-- CreateTable
CREATE TABLE "CategoriasLicencia" (
    "idCategoriaLicencia" VARCHAR(36) NOT NULL,
    "nombreCategoria" VARCHAR(10) NOT NULL,
    "descripcion" VARCHAR(255),
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriasLicencia_pkey" PRIMARY KEY ("idCategoriaLicencia")
);

-- CreateTable
CREATE TABLE "Conductores" (
    "idConductor" VARCHAR(36) NOT NULL,
    "idUsuario" VARCHAR(36) NOT NULL,
    "numeroLicencia" VARCHAR(50) NOT NULL,
    "idCategoriaLicencia" VARCHAR(36) NOT NULL,
    "fechaVencimientoLicencia" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conductores_pkey" PRIMARY KEY ("idConductor")
);

-- CreateTable
CREATE TABLE "Turnos" (
    "idTurno" VARCHAR(36) NOT NULL,
    "idConductor" VARCHAR(36) NOT NULL,
    "idVehiculo" VARCHAR(36) NOT NULL,
    "idRuta" VARCHAR(36) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" VARCHAR(10) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Programado',
    "cuposDisponibles" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turnos_pkey" PRIMARY KEY ("idTurno")
);

-- CreateTable
CREATE TABLE "Pasajes" (
    "idPasaje" VARCHAR(36) NOT NULL,
    "idTurno" VARCHAR(36) NOT NULL,
    "idUsuario" VARCHAR(36),
    "nombrePasajero" VARCHAR(100) NOT NULL,
    "documentoPasajero" VARCHAR(20),
    "asiento" VARCHAR(10),
    "precio" DECIMAL(10,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Confirmado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pasajes_pkey" PRIMARY KEY ("idPasaje")
);

-- CreateTable
CREATE TABLE "Encomiendas" (
    "idEncomienda" VARCHAR(36) NOT NULL,
    "idTurno" VARCHAR(36) NOT NULL,
    "remitenteNombre" VARCHAR(100) NOT NULL,
    "remitenteTel" VARCHAR(20) NOT NULL,
    "destinatarioNombre" VARCHAR(100) NOT NULL,
    "destinatarioTel" VARCHAR(20) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "peso" DECIMAL(10,2),
    "precio" DECIMAL(10,2) NOT NULL,
    "guia" VARCHAR(20) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encomiendas_pkey" PRIMARY KEY ("idEncomienda")
);

-- CreateTable
CREATE TABLE "Contratos" (
    "idContrato" VARCHAR(36) NOT NULL,
    "idTurno" VARCHAR(36) NOT NULL,
    "titularNombre" VARCHAR(100) NOT NULL,
    "titularDocumento" VARCHAR(20),
    "placa" VARCHAR(10) NOT NULL,
    "tipoVehiculo" VARCHAR(50),
    "capacidadPasajeros" INTEGER,
    "origen" VARCHAR(120) NOT NULL,
    "destino" VARCHAR(120) NOT NULL,
    "fechaOrigen" TIMESTAMP(3) NOT NULL,
    "fechaDestino" TIMESTAMP(3) NOT NULL,
    "pasajeros" JSONB,
    "pdfUrl" VARCHAR(255) NOT NULL,
    "fechaContrato" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contratos_pkey" PRIMARY KEY ("idContrato")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_numDocumento_key" ON "Usuarios"("numDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_correo_key" ON "Usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Ciudades_nombreCiudad_key" ON "Ciudades"("nombreCiudad");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_nombreRol_key" ON "Roles"("nombreRol");

-- CreateIndex
CREATE UNIQUE INDEX "Permisos_codigo_key" ON "Permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TiposVehiculo_nombreTipoVehiculo_key" ON "TiposVehiculo"("nombreTipoVehiculo");

-- CreateIndex
CREATE UNIQUE INDEX "MarcasVehiculos_nombreMarca_key" ON "MarcasVehiculos"("nombreMarca");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculos_placa_key" ON "Vehiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculos_vin_key" ON "Vehiculos"("vin");

-- CreateIndex
CREATE INDEX "Vehiculos_idTipoVehiculo_idx" ON "Vehiculos"("idTipoVehiculo");

-- CreateIndex
CREATE INDEX "Vehiculos_idMarcaVehiculo_idx" ON "Vehiculos"("idMarcaVehiculo");

-- CreateIndex
CREATE INDEX "Vehiculos_idPropietario_idx" ON "Vehiculos"("idPropietario");

-- CreateIndex
CREATE INDEX "Vehiculos_idConductorAsignado_idx" ON "Vehiculos"("idConductorAsignado");

-- CreateIndex
CREATE INDEX "Vehiculos_placa_idx" ON "Vehiculos"("placa");

-- CreateIndex
CREATE INDEX "Paradas_idRuta_idx" ON "Paradas"("idRuta");

-- CreateIndex
CREATE INDEX "Paradas_idUbicacion_idx" ON "Paradas"("idUbicacion");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriasLicencia_nombreCategoria_key" ON "CategoriasLicencia"("nombreCategoria");

-- CreateIndex
CREATE UNIQUE INDEX "Conductores_numeroLicencia_key" ON "Conductores"("numeroLicencia");

-- CreateIndex
CREATE INDEX "Conductores_idUsuario_idx" ON "Conductores"("idUsuario");

-- CreateIndex
CREATE INDEX "Conductores_numeroLicencia_idx" ON "Conductores"("numeroLicencia");

-- CreateIndex
CREATE INDEX "Conductores_idCategoriaLicencia_idx" ON "Conductores"("idCategoriaLicencia");

-- CreateIndex
CREATE UNIQUE INDEX "Conductores_idUsuario_key" ON "Conductores"("idUsuario");

-- CreateIndex
CREATE INDEX "Turnos_idConductor_idx" ON "Turnos"("idConductor");

-- CreateIndex
CREATE INDEX "Turnos_idVehiculo_idx" ON "Turnos"("idVehiculo");

-- CreateIndex
CREATE INDEX "Turnos_idRuta_idx" ON "Turnos"("idRuta");

-- CreateIndex
CREATE INDEX "Turnos_fecha_idx" ON "Turnos"("fecha");

-- CreateIndex
CREATE INDEX "Turnos_estado_idx" ON "Turnos"("estado");

-- CreateIndex
CREATE INDEX "Pasajes_idTurno_idx" ON "Pasajes"("idTurno");

-- CreateIndex
CREATE INDEX "Pasajes_idUsuario_idx" ON "Pasajes"("idUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "Encomiendas_guia_key" ON "Encomiendas"("guia");

-- CreateIndex
CREATE INDEX "Encomiendas_idTurno_idx" ON "Encomiendas"("idTurno");

-- CreateIndex
CREATE INDEX "Encomiendas_guia_idx" ON "Encomiendas"("guia");

-- CreateIndex
CREATE UNIQUE INDEX "Contratos_idTurno_key" ON "Contratos"("idTurno");

-- CreateIndex
CREATE INDEX "Contratos_placa_idx" ON "Contratos"("placa");

-- CreateIndex
CREATE INDEX "Contratos_fechaContrato_idx" ON "Contratos"("fechaContrato");

-- AddForeignKey
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_idRol_fkey" FOREIGN KEY ("idRol") REFERENCES "Roles"("idRol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_idCiudad_fkey" FOREIGN KEY ("idCiudad") REFERENCES "Ciudades"("idCiudad") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolesPermisos" ADD CONSTRAINT "RolesPermisos_idRol_fkey" FOREIGN KEY ("idRol") REFERENCES "Roles"("idRol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolesPermisos" ADD CONSTRAINT "RolesPermisos_idPermiso_fkey" FOREIGN KEY ("idPermiso") REFERENCES "Permisos"("idPermiso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculos" ADD CONSTRAINT "Vehiculos_idTipoVehiculo_fkey" FOREIGN KEY ("idTipoVehiculo") REFERENCES "TiposVehiculo"("idTipoVehiculo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculos" ADD CONSTRAINT "Vehiculos_idMarcaVehiculo_fkey" FOREIGN KEY ("idMarcaVehiculo") REFERENCES "MarcasVehiculos"("idMarcaVehiculo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculos" ADD CONSTRAINT "Vehiculos_idPropietario_fkey" FOREIGN KEY ("idPropietario") REFERENCES "Usuarios"("idUsuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculos" ADD CONSTRAINT "Vehiculos_idConductorAsignado_fkey" FOREIGN KEY ("idConductorAsignado") REFERENCES "Conductores"("idConductor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Origen" ADD CONSTRAINT "Origen_idUbicacion_fkey" FOREIGN KEY ("idUbicacion") REFERENCES "Ubicacion"("idUbicacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destino" ADD CONSTRAINT "Destino_idUbicacion_fkey" FOREIGN KEY ("idUbicacion") REFERENCES "Ubicacion"("idUbicacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruta" ADD CONSTRAINT "Ruta_idOrigen_fkey" FOREIGN KEY ("idOrigen") REFERENCES "Origen"("idOrigen") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruta" ADD CONSTRAINT "Ruta_idDestino_fkey" FOREIGN KEY ("idDestino") REFERENCES "Destino"("idDestino") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paradas" ADD CONSTRAINT "Paradas_idRuta_fkey" FOREIGN KEY ("idRuta") REFERENCES "Ruta"("idRuta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paradas" ADD CONSTRAINT "Paradas_idUbicacion_fkey" FOREIGN KEY ("idUbicacion") REFERENCES "Ubicacion"("idUbicacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conductores" ADD CONSTRAINT "Conductores_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuarios"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conductores" ADD CONSTRAINT "Conductores_idCategoriaLicencia_fkey" FOREIGN KEY ("idCategoriaLicencia") REFERENCES "CategoriasLicencia"("idCategoriaLicencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turnos" ADD CONSTRAINT "Turnos_idConductor_fkey" FOREIGN KEY ("idConductor") REFERENCES "Conductores"("idConductor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turnos" ADD CONSTRAINT "Turnos_idVehiculo_fkey" FOREIGN KEY ("idVehiculo") REFERENCES "Vehiculos"("idVehiculo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turnos" ADD CONSTRAINT "Turnos_idRuta_fkey" FOREIGN KEY ("idRuta") REFERENCES "Ruta"("idRuta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasajes" ADD CONSTRAINT "Pasajes_idTurno_fkey" FOREIGN KEY ("idTurno") REFERENCES "Turnos"("idTurno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasajes" ADD CONSTRAINT "Pasajes_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuarios"("idUsuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encomiendas" ADD CONSTRAINT "Encomiendas_idTurno_fkey" FOREIGN KEY ("idTurno") REFERENCES "Turnos"("idTurno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratos" ADD CONSTRAINT "Contratos_idTurno_fkey" FOREIGN KEY ("idTurno") REFERENCES "Turnos"("idTurno") ON DELETE CASCADE ON UPDATE CASCADE;
