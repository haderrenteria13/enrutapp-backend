-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'EXPIRADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Pasajes" ADD COLUMN     "idOrdenCompra" VARCHAR(36);

-- CreateTable
CREATE TABLE "OrdenesCompra" (
    "idOrdenCompra" VARCHAR(36) NOT NULL,
    "idTurno" VARCHAR(36) NOT NULL,
    "idUsuario" VARCHAR(36) NOT NULL,
    "referenciaWompi" VARCHAR(80) NOT NULL,
    "cantidadTiquetes" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'COP',
    "estado" "EstadoOrdenCompra" NOT NULL DEFAULT 'PENDIENTE',
    "correoPagador" VARCHAR(120) NOT NULL,
    "nombrePagador" VARCHAR(100) NOT NULL,
    "telefonoPagador" VARCHAR(20),
    "pasajeros" JSONB NOT NULL,
    "wompiTransactionId" VARCHAR(100),
    "wompiStatus" VARCHAR(30),
    "wompiPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenesCompra_pkey" PRIMARY KEY ("idOrdenCompra")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrdenesCompra_referenciaWompi_key" ON "OrdenesCompra"("referenciaWompi");

-- CreateIndex
CREATE INDEX "OrdenesCompra_idTurno_idx" ON "OrdenesCompra"("idTurno");

-- CreateIndex
CREATE INDEX "OrdenesCompra_idUsuario_idx" ON "OrdenesCompra"("idUsuario");

-- CreateIndex
CREATE INDEX "OrdenesCompra_estado_idx" ON "OrdenesCompra"("estado");

-- CreateIndex
CREATE INDEX "Pasajes_idOrdenCompra_idx" ON "Pasajes"("idOrdenCompra");

-- AddForeignKey
ALTER TABLE "Pasajes" ADD CONSTRAINT "Pasajes_idOrdenCompra_fkey" FOREIGN KEY ("idOrdenCompra") REFERENCES "OrdenesCompra"("idOrdenCompra") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenesCompra" ADD CONSTRAINT "OrdenesCompra_idTurno_fkey" FOREIGN KEY ("idTurno") REFERENCES "Turnos"("idTurno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenesCompra" ADD CONSTRAINT "OrdenesCompra_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuarios"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;
