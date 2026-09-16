# 📚 Frequência+

Sistema web para **controle de frequência acadêmica**, desenvolvido como solução para o projeto **P07 — Controle de Frequência**.

O Frequência+ permite que professores gerenciem turmas e aulas, enquanto alunos registram sua presença por meio de um **QR Code temporário**, tornando o processo de chamada mais rápido e automatizado.

---

## 🎯 Objetivo

O projeto tem como objetivo facilitar o registro e acompanhamento da frequência dos alunos.

O sistema permite:

- gerenciamento de professores e alunos;
- criação e gerenciamento de turmas;
- matrícula de alunos;
- criação e encerramento de aulas;
- registro de presença utilizando QR Code;
- cálculo automático da frequência;
- identificação de alunos em risco por faltas;
- geração de relatórios de frequência.

---

## 🛠️ Tecnologias utilizadas

O projeto foi desenvolvido utilizando:

- **Next.js**
- **React**
- **TypeScript**
- **Supabase**
- **PostgreSQL**
- **Supabase Auth**
- **Vercel**

O Supabase é utilizado para autenticação, banco de dados e controle de acesso às informações.

---

## 👥 Perfis do sistema

O sistema possui dois tipos principais de usuário.

### 👨‍🏫 Professor

O professor pode:

- criar turmas;
- adicionar alunos às turmas;
- iniciar aulas;
- gerar QR Codes para registro de presença;
- encerrar aulas;
- acompanhar a frequência dos alunos;
- visualizar relatórios da turma;
- exportar dados de frequência.

### 🎓 Aluno

O aluno pode:

- acessar suas turmas;
- registrar presença em uma aula;
- acompanhar sua porcentagem de frequência;
- visualizar sua situação em relação ao limite mínimo de frequência.

---

## 📱 Registro de presença

Ao iniciar uma aula, o sistema gera um **QR Code associado à aula**, com validade limitada.

O aluno deve estar autenticado e matriculado na turma para registrar sua presença.

O sistema verifica:

1. se o usuário está autenticado;
2. se o usuário é aluno;
3. se o aluno pertence à turma;
4. se a aula está ativa;
5. se o QR Code ainda está dentro do prazo de validade;
6. se o aluno ainda não registrou presença naquela aula.

Após as verificações, a presença é registrada no banco de dados.

Cada aluno pode registrar presença **apenas uma vez por aula**.

---

## 📊 Controle de frequência

A frequência é calculada automaticamente com base na quantidade de aulas realizadas e presenças registradas.

O professor pode definir o limite mínimo de frequência da turma.

Caso a frequência do aluno fique abaixo desse limite, o sistema apresenta um **alerta de risco por faltas**.

---

## 🔐 Segurança

O projeto utiliza:

- autenticação através do **Supabase Auth**;
- políticas de **Row Level Security (RLS)**;
- validação de matrícula;
- QR Code com token temporário;
- prevenção de presença duplicada;
- validações realizadas no banco de dados.

> Para facilitar a demonstração do MVP, o cadastro permite selecionar o perfil de aluno ou professor. Em um sistema institucional real, a atribuição do perfil de professor deveria ser realizada por um administrador ou pela própria instituição.

---

## 🗄️ Estrutura do banco de dados

As principais tabelas utilizadas são:

| Tabela | Responsabilidade |
|---|---|
| `profiles` | Dados e tipo dos usuários |
| `turmas` | Informações das turmas |
| `matriculas` | Relação entre alunos e turmas |
| `aulas` | Aulas e tokens temporários |
| `presencas` | Registro das presenças |

O esquema completo pode ser encontrado em:

```text
supabase/schema.sql
```

---

# 🚀 Executando o projeto

## 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd Trabalho-ds
```

## 2. Instalar as dependências

```bash
npm install
```

## 3. Configurar o Supabase

Crie um projeto no Supabase e acesse:

```text
SQL Editor
```

Execute o arquivo:

```text
supabase/schema.sql
```

Isso criará as tabelas, funções, triggers e políticas necessárias para o funcionamento do sistema.

---

## 4. Configurar as variáveis de ambiente

Crie um arquivo:

```text
.env.local
```

na raiz do projeto.

Adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

As informações podem ser encontradas nas configurações de API do projeto no Supabase.

> ⚠️ Não envie o arquivo `.env.local` para o GitHub.

---

## 5. Executar localmente

```bash
npm run dev
```

Depois acesse:

```text
http://localhost:3000
```

---

# 🧪 Fluxo de demonstração

Uma forma simples de demonstrar o funcionamento completo do sistema é:

1. Criar uma conta de **professor**.
2. Criar uma conta de **aluno**.
3. Entrar como professor.
4. Criar uma turma.
5. Matricular o aluno utilizando seu e-mail.
6. Iniciar uma nova aula.
7. Gerar o QR Code da aula.
8. Entrar como aluno em outro navegador ou dispositivo.
9. Escanear o QR Code.
10. Registrar a presença.
11. Retornar ao painel do professor.
12. Conferir o relatório e a frequência atualizada.
13. Conferir a frequência também pelo painel do aluno.

---

# ☁️ Deploy

O projeto pode ser publicado utilizando a **Vercel**.

As seguintes variáveis também devem ser configuradas no ambiente da Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Para branches de desenvolvimento, como `melhorias`, elas podem ser configuradas no ambiente **Preview**.

Nenhuma chave privada ou arquivo `.env.local` deve ser enviado para o repositório.

---

# 📂 Estrutura principal

```text
Trabalho-ds/
├── app/              # Páginas e rotas da aplicação
├── components/       # Componentes reutilizáveis
├── hooks/            # Hooks utilizados pela aplicação
├── lib/              # Integrações, tipos e funções auxiliares
├── public/           # Arquivos públicos
├── supabase/         # Estrutura e configuração do banco
│   └── schema.sql
├── .env.example      # Exemplo das variáveis de ambiente
├── package.json
└── README.md
```

---

# 📌 Status do projeto

🚧 **MVP em desenvolvimento**

Funcionalidades principais previstas:

- [x] Autenticação de usuários
- [x] Perfis de aluno e professor
- [x] Cadastro de turmas
- [x] Matrícula de alunos
- [x] Criação de aulas
- [x] QR Code temporário
- [x] Registro de presença
- [x] Cálculo de frequência
- [x] Alerta de frequência
- [x] Relatórios
- [x] Exportação CSV

---

## 👨‍💻 Equipe

Projeto desenvolvido para a disciplina de **Desenvolvimento de Software**.

<!-- Adicionar nomes dos integrantes aqui -->