export const turmas = [
  {
    id: 'ds-2026-2',
    disciplina: 'Desenvolvimento de Software',
    codigo: 'DS2026.2',
    periodo: '2026.2',
    alunos: 30,
    aulas: 18,
    frequenciaMedia: 84.6,
    limiteFrequencia: 75,
  },
  {
    id: 'ac-2026-2',
    disciplina: 'Arquitetura de Computadores',
    codigo: 'AC2026.2',
    periodo: '2026.2',
    alunos: 28,
    aulas: 20,
    frequenciaMedia: 91.2,
    limiteFrequencia: 75,
  },
  {
    id: 'ed-2026-2',
    disciplina: 'Estruturas de Dados',
    codigo: 'ED2026.2',
    periodo: '2026.2',
    alunos: 34,
    aulas: 17,
    frequenciaMedia: 78.8,
    limiteFrequencia: 75,
  },
];

export const relatorios = {
  'ds-2026-2': [
    { id: 1, nome: 'Ana Beatriz', matricula: '20261001', presencas: 17, faltas: 1, frequencia: 94.4 },
    { id: 2, nome: 'Bruno Henrique', matricula: '20261002', presencas: 15, faltas: 3, frequencia: 83.3 },
    { id: 3, nome: 'Carla Souza', matricula: '20261003', presencas: 13, faltas: 5, frequencia: 72.2 },
    { id: 4, nome: 'Daniel Lima', matricula: '20261004', presencas: 12, faltas: 6, frequencia: 66.7 },
    { id: 5, nome: 'Eduarda Alves', matricula: '20261005', presencas: 16, faltas: 2, frequencia: 88.9 },
    { id: 6, nome: 'Felipe Santos', matricula: '20261006', presencas: 10, faltas: 8, frequencia: 55.6 },
    { id: 7, nome: 'Gabriela Rocha', matricula: '20261007', presencas: 18, faltas: 0, frequencia: 100 },
    { id: 8, nome: 'Henrique Costa', matricula: '20261008', presencas: 14, faltas: 4, frequencia: 77.8 },
  ],
  'ac-2026-2': [
    { id: 9, nome: 'Igor Melo', matricula: '20261101', presencas: 19, faltas: 1, frequencia: 95 },
    { id: 10, nome: 'Julia Martins', matricula: '20261102', presencas: 18, faltas: 2, frequencia: 90 },
    { id: 11, nome: 'Lucas Nunes', matricula: '20261103', presencas: 14, faltas: 6, frequencia: 70 },
    { id: 12, nome: 'Marina Freitas', matricula: '20261104', presencas: 20, faltas: 0, frequencia: 100 },
  ],
  'ed-2026-2': [
    { id: 13, nome: 'Nicolas Barros', matricula: '20261201', presencas: 13, faltas: 4, frequencia: 76.5 },
    { id: 14, nome: 'Olivia Araújo', matricula: '20261202', presencas: 11, faltas: 6, frequencia: 64.7 },
    { id: 15, nome: 'Paulo Victor', matricula: '20261203', presencas: 15, faltas: 2, frequencia: 88.2 },
    { id: 16, nome: 'Rafaela Gomes', matricula: '20261204', presencas: 12, faltas: 5, frequencia: 70.6 },
  ],
};

export const presencasIniciais = [
  { id: 1, nome: 'Ana Beatriz', matricula: '20261001', horario: '14:02' },
  { id: 2, nome: 'Bruno Henrique', matricula: '20261002', horario: '14:03' },
  { id: 3, nome: 'Eduarda Alves', matricula: '20261005', horario: '14:04' },
  { id: 4, nome: 'Gabriela Rocha', matricula: '20261007', horario: '14:04' },
  { id: 5, nome: 'Henrique Costa', matricula: '20261008', horario: '14:05' },
];
