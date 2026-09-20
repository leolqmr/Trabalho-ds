import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import {Turma} from './turma.entity.js';


@Entity('aulas')
export class Aula {
    @PrimaryGeneratedColumn() 
    id : number;

    @Column()
    data : string;

    @Column()
    horario : string;

    @ManyToOne(() => Turma)
    @JoinColumn({name: 'turma_id'})
    turma : Turma // O tipo é o objeto turma, funciona como um ponteiro
}