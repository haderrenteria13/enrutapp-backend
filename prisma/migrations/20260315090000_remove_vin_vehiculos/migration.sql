-- Eliminar VIN de la tabla Vehiculos
DROP INDEX IF EXISTS "Vehiculos_vin_key";

ALTER TABLE "Vehiculos"
DROP COLUMN IF EXISTS "vin";
