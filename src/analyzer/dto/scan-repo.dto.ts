import { IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanRepoDto {
  @ApiProperty({
    description: "L'URL complète du dépôt GitHub public à analyser",
    example: 'https://github.com/nestjs/nest',
  })
  @IsNotEmpty({ message: "L'URL du repository Github est requise" })
  @IsUrl({}, { message: "Format d'URL invalide" })
  url: string;
}
