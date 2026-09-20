import { Controller, Get, Param } from '@nestjs/common';
import { TurmasService } from './turmas.service.js';

@Controller('turmas') // Primeira parte do endereço (/turmas)
export class TurmasController {
    constructor(private readonly turmasService: TurmasService){}

    @Get(':id_turma/alunos')  // Segunda parte (/:id_turma/alunos)
    listarAlunos(@Param('id_turma') idTurma : string ) { // Método para listar alunos
        return {
            mensagem : "Rota alcançada com êxito", turma_solicitada: idTurma
        };
    }
}