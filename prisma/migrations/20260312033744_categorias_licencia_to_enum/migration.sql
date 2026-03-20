/*
  Warnings:

  - You are about to drop the column `idCategoriaLicencia` on the `Conductores` table. All the data in the column will be lost.
  - You are about to drop the `CategoriasLicencia` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categoriaLicencia` to the `Conductores` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategoriaLicencia" AS ENUM ('A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3');

-- DropForeignKey
ALTER TABLE "Conductores" DROP CONSTRAINT "Conductores_idCategoriaLicencia_fkey";

-- DropIndex
DROP INDEX "Conductores_idCategoriaLicencia_idx";

-- AlterTable
ALTER TABLE "Conductores" DROP COLUMN "idCategoriaLicencia",
ADD COLUMN     "categoriaLicencia" "CategoriaLicencia" NOT NULL;

-- DropTable
DROP TABLE "CategoriasLicencia";
