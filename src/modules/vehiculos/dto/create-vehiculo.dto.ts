import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  IsPositive,
  IsNumber,
  IsDateString,
  IsIn,
  Length,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export type TipoPlaca = 'BLANCA' | 'AMARILLA';
export const COLOR_VEHICULO_VALUES = [
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
  'Otro',
] as const;
export type ColorVehiculo = (typeof COLOR_VEHICULO_VALUES)[number];

/**
 * DTO para crear un nuevo vehículo
 */
export class CreateVehiculoDto {
  @ApiProperty({
    description:
      'ID único del vehículo (UUID). Si no se proporciona, se genera automáticamente',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsUUID('all', { message: 'El ID del vehículo debe ser un UUID válido' }) // <- CAMBIO AQUÍ
  @IsOptional()
  idVehiculo?: string;

  @ApiProperty({
    description: 'ID del tipo de vehículo',
    example: '550e8400-e29b-41d4-a716-446655440010',
    type: String,
    format: 'uuid',
  })
  @IsUUID('all', {
    message: 'El ID del tipo de vehículo debe ser un UUID válido',
  }) // <- CAMBIO AQUÍ
  @IsNotEmpty({ message: 'El tipo de vehículo es obligatorio' })
  idTipoVehiculo!: string;

  @ApiProperty({
    description: 'ID de la marca del vehículo',
    example: '550e8400-e29b-41d4-a716-446655440020',
    type: String,
    format: 'uuid',
  })
  @IsUUID('all', { message: 'El ID de la marca debe ser un UUID válido' }) // <- CAMBIO AQUÍ
  @IsNotEmpty({ message: 'La marca del vehículo es obligatoria' })
  idMarcaVehiculo!: string;

  @ApiProperty({
    description: 'ID del propietario del vehículo (Usuario)',
    example: '550e8400-e29b-41d4-a716-446655440030',
    type: String,
    format: 'uuid',
  })
  @IsUUID('all', { message: 'El ID del propietario debe ser un UUID válido' })
  @IsOptional()
  idPropietario?: string;

  @ApiProperty({
    description:
      'Nombre del propietario externo (si no es usuario del sistema)',
    example: 'Juan Pérez',
    required: false,
    type: String,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre del propietario externo debe ser texto' })
  @IsOptional()
  @Length(3, 100, {
    message:
      'El nombre del propietario externo debe tener entre 3 y 100 caracteres',
  })
  propietarioExternoNombre?: string;

  @ApiProperty({
    description:
      'Documento del propietario externo (si no es usuario del sistema)',
    example: '1234567890',
    required: false,
    type: String,
    maxLength: 20,
  })
  @IsString({ message: 'El documento del propietario externo debe ser texto' })
  @IsOptional()
  @Length(5, 20, {
    message:
      'El documento del propietario externo debe tener entre 5 y 20 caracteres',
  })
  propietarioExternoDocumento?: string;

  @ApiProperty({
    description:
      'Teléfono del propietario externo (si no es usuario del sistema)',
    example: '3001234567',
    required: false,
    type: String,
    maxLength: 20,
  })
  @IsString({ message: 'El teléfono del propietario externo debe ser texto' })
  @IsOptional()
  @Length(7, 20, {
    message:
      'El teléfono del propietario externo debe tener entre 7 y 20 caracteres',
  })
  propietarioExternoTelefono?: string;

  @ApiProperty({
    description: 'ID del conductor asignado al vehículo (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440040',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsUUID('all', { message: 'El ID del conductor debe ser un UUID válido' })
  @IsOptional()
  idConductorAsignado?: string;

  @ApiProperty({
    description: 'Placa del vehículo con formato AAA999',
    example: 'ABC123',
    type: String,
    minLength: 6,
    maxLength: 6,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'La placa debe ser texto' })
  @IsNotEmpty({ message: 'La placa es obligatoria' })
  @Length(6, 6, {
    message: 'La placa debe tener exactamente 6 caracteres',
  })
  @Matches(/^[A-Z]{3}\d{3}$/, {
    message:
      'La placa debe tener el formato ABC123 (3 letras mayúsculas y 3 números)',
  })
  placa!: string;

  @ApiProperty({
    description: 'Tipo de placa del vehículo',
    enum: ['BLANCA', 'AMARILLA'],
    example: 'BLANCA',
    required: false,
  })
  @IsIn(['BLANCA', 'AMARILLA'], {
    message: 'El tipo de placa debe ser BLANCA o AMARILLA',
  })
  @IsOptional()
  tipoPlaca?: TipoPlaca;

  @ApiProperty({
    description: 'Línea o modelo del vehículo',
    example: 'Corolla',
    type: String,
    maxLength: 50,
  })
  @IsString({ message: 'La línea debe ser texto' })
  @IsNotEmpty({ message: 'La línea del vehículo es obligatoria' })
  linea!: string;

  @ApiProperty({
    description: 'Año del modelo del vehículo',
    example: 2023,
    type: Number,
    minimum: 1900,
    maximum: 2100,
  })
  @IsInt({ message: 'El modelo debe ser un número entero' })
  @IsPositive({ message: 'El modelo debe ser un número positivo' })
  @Min(1900, { message: 'El modelo no puede ser menor a 1900' })
  @Max(2100, { message: 'El modelo no puede ser mayor a 2100' })
  @Type(() => Number)
  modelo!: number;

  @ApiProperty({
    description: 'Color del vehículo',
    example: 'Blanco',
    type: String,
    enum: COLOR_VEHICULO_VALUES,
  })
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @IsIn(COLOR_VEHICULO_VALUES, {
    message: 'El color seleccionado no es válido',
  })
  color!: ColorVehiculo;

  @ApiProperty({
    description: 'Capacidad de pasajeros del vehículo',
    example: 5,
    type: Number,
    minimum: 1,
  })
  @IsInt({ message: 'La capacidad de pasajeros debe ser un número entero' })
  @IsPositive({ message: 'La capacidad de pasajeros debe ser positiva' })
  @Min(1, { message: 'La capacidad debe ser al menos 1' })
  @Type(() => Number)
  capacidadPasajeros!: number;

  @ApiProperty({
    description:
      'Capacidad de carga del vehículo en kilogramos (opcional, con 2 decimales)',
    example: 1500.5,
    required: false,
    type: Number,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'La capacidad de carga debe ser un número con máximo 2 decimales',
    },
  )
  @IsPositive({ message: 'La capacidad de carga debe ser positiva' })
  @IsOptional()
  @Type(() => Number)
  capacidadCarga?: number;

  @ApiProperty({
    description: 'Fecha de vencimiento del SOAT',
    example: '2025-12-31',
    required: true,
    type: String,
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'La fecha de vencimiento del SOAT debe ser válida' },
  )
  @IsNotEmpty({ message: 'La fecha de vencimiento del SOAT es obligatoria' })
  soatVencimiento?: string;

  @ApiProperty({
    description: 'Fecha de vencimiento de la revisión tecnomecánica',
    example: '2025-12-31',
    required: true,
    type: String,
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'La fecha de vencimiento de la tecnomecánica debe ser válida' },
  )
  @IsNotEmpty({
    message: 'La fecha de vencimiento de la tecnomecánica es obligatoria',
  })
  tecnomecanicaVencimiento?: string;

  @ApiProperty({
    description: 'Fecha de vencimiento del seguro',
    example: '2025-12-31',
    required: true,
    type: String,
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'La fecha de vencimiento del seguro debe ser válida' },
  )
  @IsNotEmpty({ message: 'La fecha de vencimiento del seguro es obligatoria' })
  seguroVencimiento?: string;

  @ApiProperty({
    description: 'Estado del vehículo (activo/inactivo)',
    example: true,
    required: false,
    type: Boolean,
    default: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  @IsOptional()
  estado?: boolean;

  @ApiProperty({
    description:
      'URL relativa de la foto del vehículo (se asigna automáticamente al subir el archivo "foto")',
    example: '/uploads/vehiculos/550e8400-e29b-41d4-a716-446655440001.jpg',
    required: false,
    type: String,
    maxLength: 255,
  })
  @IsString({ message: 'La URL de la foto debe ser texto' })
  @IsOptional()
  @Length(1, 255, {
    message: 'La URL de la foto no puede exceder 255 caracteres',
  })
  fotoUrl?: string;
}
