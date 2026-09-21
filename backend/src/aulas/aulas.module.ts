import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aula } from '../entities/aula.entity.js';
import { Presenca } from '../entities/presenca.entity.js';
import { AulasController } from './aulas.controller.js';
import { AulasService } from './aulas.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Aula, Presenca])],
  controllers: [AulasController],
  providers: [AulasService],
})
export class AulasModule {}