import { PartialType } from '@nestjs/swagger';
import { CreateEncomiendaDto } from './create-encomienda.dto';

export class UpdateEncomiendaDto extends PartialType(CreateEncomiendaDto) {}
