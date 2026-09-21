import { Body, Controller, Param, Post } from '@nestjs/common';
import { AulasService } from './aulas.service.js';

@Controller('aulas')
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @Post(':id_aula/presencas')
  registrarPresencas(@Param('id_aula') idAula: string, @Body() body: unknown) {
    return this.aulasService.registrarPresencas(Number(idAula), body);
  }
}