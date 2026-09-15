export type TipoPerfil = "aluno" | "professor";

export type Perfil = {
  id: string;
  nome: string;
  email: string;
  tipo: TipoPerfil;
  created_at?: string;
};

export type Turma = {
  id: string;
  nome: string;
  disciplina: string;
  professor_id: string;
  limite_frequencia: number;
  created_at?: string;
};

export type Matricula = {
  id: string;
  turma_id: string;
  aluno_id: string;
  created_at?: string;
};

export type Aula = {
  id: string;
  turma_id: string;
  data_hora: string;
  token: string;
  expira_em: string;
  ativa: boolean;
  created_at?: string;
};

export type Presenca = {
  id: string;
  aula_id: string;
  aluno_id: string;
  registrado_em: string;
};

export type LinhaRelatorio = {
  aluno: Perfil;
  presencas: number;
  faltas: number;
  totalAulas: number;
  frequencia: number;
};
