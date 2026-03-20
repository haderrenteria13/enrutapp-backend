-- AlterTable
ALTER TABLE "Encomiendas" ADD COLUMN     "fotoUrl" VARCHAR(255),
ADD COLUMN     "verificado" BOOLEAN NOT NULL DEFAULT false;
