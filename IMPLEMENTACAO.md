# Guia rápido de integração com o repositório do grupo

Este pacote foi montado para substituir/complementar o protótipo atual do repositório `leolqmr/Trabalho-ds`.

## Estrutura principal

```text
app/
  login/                  login
  cadastro/               criação de conta
  professor/              dashboard do professor
  professor/turmas/[id]/  turma, aula, QR e relatório
  aluno/                  dashboard de frequência do aluno
  presenca/[token]/       validação do QR
components/               componentes reutilizáveis
hooks/                    proteção simples de páginas por perfil
lib/                      Supabase, tipos, frequência e formatação
supabase/schema.sql       banco, trigger, RLS e função do registro
```

## Como aplicar no GitHub sem perder o que vocês já têm

1. Faça uma branch de segurança:

```bash
git checkout -b backup-prototipo

git add .
git commit -m "backup do prototipo antes do MVP"
```

2. Volte para a branch de trabalho (por exemplo `main`) e copie os arquivos deste pacote para a raiz do projeto.
3. Rode:

```bash
npm install
npm run dev
```

4. Configure o Supabase usando `supabase/schema.sql` e `.env.local`.
5. Teste o fluxo completo antes de fazer push.

## Fluxo implementado

```text
Professor faz login
      ↓
Cria turma
      ↓
Matricula aluno pelo e-mail
      ↓
Inicia aula
      ↓
Supabase gera token UUID com expiração de 10 min
      ↓
Next.js transforma URL da presença em QR Code
      ↓
Aluno abre QR e, se necessário, faz login
      ↓
RPC registrar_presenca valida tudo no banco
      ↓
Presença é registrada uma única vez
      ↓
Professor e aluno veem frequência recalculada
```

## Testes manuais indispensáveis

- aluno não matriculado tenta usar o QR → deve falhar;
- aluno tenta registrar duas vezes → deve dizer que já registrou;
- professor tenta usar QR → deve falhar como perfil inválido;
- QR depois de 10 min → deve expirar;
- professor encerra a aula → QR deixa de funcionar;
- aluno abaixo do limite → deve mostrar risco de reprovação;
- aluno com 0 aulas → frequência inicial não deve gerar divisão por zero.
