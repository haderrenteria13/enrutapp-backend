/*
  Warnings:

  - The values [Pasaporte] on the enum `TipoDocumento` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoDocumento_new" AS ENUM ('CC', 'CE', 'TI', 'PP', 'NIT');
ALTER TABLE "Usuarios" ALTER COLUMN "tipoDoc" TYPE "TipoDocumento_new" USING ("tipoDoc"::text::"TipoDocumento_new");
ALTER TYPE "TipoDocumento" RENAME TO "TipoDocumento_old";
ALTER TYPE "TipoDocumento_new" RENAME TO "TipoDocumento";
DROP TYPE "public"."TipoDocumento_old";
COMMIT;

-- AlterTable
ALTER TABLE "Vehiculos" ALTER COLUMN "fotoUrl" DROP NOT NULL;
