import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import {Aula} from './aula.entity.js';

@Entity('presencas')
export class Presenca{
    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    aluno_id : string;

    @Column()
    presente : boolean;

    @ManyToOne(()=> Aula)
    @JoinColumn({name : "aula_id"})
    aula : Aula; // o tipo é a classe Aula
}

