# Frequência+ — MVP do P07 Controle de Frequência

Aplicação em **Next.js + TypeScript + Supabase** para registro e consolidação de frequência usando **QR Code temporário**.

## O que já está implementado

- Cadastro e login de alunos/professores com Supabase Auth
- Perfil automático (`aluno` ou `professor`)
- Cadastro de turmas e limite de frequência
- Matrícula de alunos por e-mail
- Início e encerramento de aula
- Token/QR Code com validade de 10 minutos
- Validação de usuário logado, matrícula, prazo e duplicidade
- Registro atômico de presença no PostgreSQL
- Dashboard do aluno
- Cálculo automático de frequência
- Alerta de risco por falta
- Relatório por turma/disciplina
- Exportação do relatório em CSV
- Row Level Security (RLS) no Supabase

## 1. Instalar dependências

```bash
npm install
```

> Se você estiver copiando estes arquivos por cima do repositório antigo e o `package-lock.json` antigo estiver presente, rode `npm install` para atualizá-lo antes de subir para o GitHub.

## 2. Criar/configurar o Supabase

1. Abra o projeto no Supabase.
2. Vá em **SQL Editor**.
3. Execute todo o arquivo `supabase/schema.sql`.
4. Em **Authentication > Providers > Email**, para a apresentação, vocês podem desabilitar a exigência de confirmação de e-mail. Em produção, é melhor mantê-la ligada.

## 3. Configurar variáveis locais

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Essas informações ficam em **Supabase > Project Settings > API**.

## 4. Rodar no VS Code

```bash
npm run dev
```

Abra `http://localhost:3000`.

## 5. Roteiro de demonstração

1. Crie uma conta de **professor**.
2. Crie uma conta de **aluno** (pode usar aba anônima/outro navegador).
3. Como professor, crie uma turma.
4. Adicione o aluno usando o e-mail cadastrado.
5. Clique em **Iniciar aula**.
6. Escaneie o QR com o celular ou abra a URL gerada usando a conta do aluno.
7. A presença será registrada uma única vez.
8. Volte para a turma do professor para ver o relatório atualizado.
9. No painel do aluno, confira frequência e alerta.

## 6. Vercel

Adicione as mesmas duas variáveis em:

**Vercel > Project > Settings > Environment Variables**

Depois faça um novo deploy.

## Observação de segurança do MVP

Para facilitar a demonstração, a tela de cadastro permite escolher entre aluno e professor. Em um sistema institucional real, o perfil de professor deve ser atribuído por uma coordenação/administrador, não pelo próprio usuário.

O QR identifica a aula, não o aluno. O aluno é identificado pela sessão autenticada. O banco ainda verifica matrícula, expiração e duplicidade. O próximo passo de segurança, caso sobre tempo, é adicionar geolocalização ou QR rotativo.
