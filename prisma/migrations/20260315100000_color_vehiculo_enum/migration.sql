-- Convertir campo color de texto a enum en Vehiculos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ColorVehiculo') THEN
    CREATE TYPE "ColorVehiculo" AS ENUM (
      'Blanco',
      'Negro',
      'Gris',
      'Plateado',
      'Rojo',
      'Azul',
      'Verde',
      'Amarillo',
      'Beige',
      'Cafe',
      'Naranja',
      'Otro'
    );
  END IF;
END
$$;

ALTER TABLE "Vehiculos"
ALTER COLUMN "color" TYPE "ColorVehiculo"
USING (
  CASE lower(trim(coalesce("color", '')))
    WHEN 'blanco' THEN 'Blanco'
    WHEN 'negro' THEN 'Negro'
    WHEN 'gris' THEN 'Gris'
    WHEN 'plateado' THEN 'Plateado'
    WHEN 'rojo' THEN 'Rojo'
    WHEN 'azul' THEN 'Azul'
    WHEN 'verde' THEN 'Verde'
    WHEN 'amarillo' THEN 'Amarillo'
    WHEN 'beige' THEN 'Beige'
    WHEN 'cafe' THEN 'Cafe'
    WHEN 'café' THEN 'Cafe'
    WHEN 'naranja' THEN 'Naranja'
    ELSE 'Otro'
  END
)::"ColorVehiculo";
