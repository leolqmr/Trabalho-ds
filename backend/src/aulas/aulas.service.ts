import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aula } from '../entities/aula.entity.js';
import { Presenca } from '../entities/presenca.entity.js';

interface MarcacaoPresenca {
  aluno_id: string;
  presente: boolean;
}

@Injectable()
export class AulasService {
  constructor(
    @InjectRepository(Aula) private readonly aulasRepo: Repository<Aula>,
    @InjectRepository(Presenca) private readonly presencasRepo: Repository<Presenca>,
  ) {}

  async registrarPresencas(idAula: number, payload: unknown) {
    const marcacoes = this.validarPayload(payload);

    const aula = await this.aulasRepo.findOneBy({ id: idAula });
    if (!aula) {
      throw new NotFoundException(`Aula ${idAula} não encontrada`);
    }

    const presencas = marcacoes.map((m) =>
      this.presencasRepo.create({ aluno_id: m.aluno_id, presente: m.presente, aula }),
    );

    return this.presencasRepo.save(presencas);
  }

  private validarPayload(payload: unknown): MarcacaoPresenca[] {
    if (!Array.isArray(payload)) {
      throw new BadRequestException('O corpo da requisição deve ser uma lista de marcações');
    }
    return payload.map((item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new BadRequestException(`Item ${index} inválido`);
      }
      const { aluno_id, presente } = item as Record<string, unknown>;
      if (typeof aluno_id !== 'string' || aluno_id.trim() === '') {
        throw new BadRequestException(`Item ${index}: "aluno_id" precisa ser uma string`);
      }
      if (typeof presente !== 'boolean') {
        throw new BadRequestException(`Item ${index}: "presente" precisa ser true ou false`);
      }
      return { aluno_id, presente };
    });
  }
}