import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('turmas')
export class Turma {
    @PrimaryGeneratedColumn()  // serve para "enumerar" as linhas
    id : number;

    @Column()
    nome : string;

    @Column()
    id_disciplina : string;

    @Column()
    professor : string;
}