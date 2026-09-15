-- Frequência+ - esquema do Supabase
-- Execute este arquivo no SQL Editor do Supabase antes de usar o sistema.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  tipo text not null check (tipo in ('aluno', 'professor')),
  created_at timestamptz not null default now()
);

create table if not exists public.turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  disciplina text not null,
  professor_id uuid not null references public.profiles(id) on delete cascade,
  limite_frequencia numeric(5,2) not null default 75 check (limite_frequencia between 1 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.matriculas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint matricula_unica unique (turma_id, aluno_id)
);

create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  data_hora timestamptz not null default now(),
  token uuid not null default gen_random_uuid() unique,
  expira_em timestamptz not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.presencas (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references public.aulas(id) on delete cascade,
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  registrado_em timestamptz not null default now(),
  constraint presenca_unica_por_aula unique (aula_id, aluno_id)
);

create index if not exists idx_turmas_professor on public.turmas(professor_id);
create index if not exists idx_matriculas_turma on public.matriculas(turma_id);
create index if not exists idx_matriculas_aluno on public.matriculas(aluno_id);
create index if not exists idx_aulas_turma on public.aulas(turma_id);
create index if not exists idx_aulas_token on public.aulas(token);
create index if not exists idx_presencas_aula on public.presencas(aula_id);
create index if not exists idx_presencas_aluno on public.presencas(aluno_id);

-- Cria o perfil automaticamente quando alguém se cadastra pelo Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, tipo)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    case when new.raw_user_meta_data ->> 'tipo' = 'professor' then 'professor' else 'aluno' end
  )
  on conflict (id) do update
  set nome = excluded.nome,
      email = excluded.email,
      tipo = excluded.tipo;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of raw_user_meta_data, email on auth.users
for each row execute procedure public.handle_new_user();

-- Também cria/atualiza profiles para contas que já existiam antes deste schema.
insert into public.profiles (id, nome, email, tipo)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'nome'), ''), split_part(u.email, '@', 1)),
  lower(u.email),
  case when u.raw_user_meta_data ->> 'tipo' = 'professor' then 'professor' else 'aluno' end
from auth.users u
where u.email is not null
on conflict (id) do update
set nome = excluded.nome,
    email = excluded.email,
    tipo = excluded.tipo;

-- Funções auxiliares SECURITY DEFINER evitam recursão entre políticas RLS.
create or replace function public.is_professor_da_turma(p_turma uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.turmas t
    where t.id = p_turma and t.professor_id = auth.uid()
  );
$$;

create or replace function public.is_aluno_da_turma(p_turma uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matriculas m
    where m.turma_id = p_turma and m.aluno_id = auth.uid()
  );
$$;

create or replace function public.is_professor_da_aula(p_aula uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.aulas a
    join public.turmas t on t.id = a.turma_id
    where a.id = p_aula and t.professor_id = auth.uid()
  );
$$;

-- Registro de presença atômico: valida login, perfil, turma, prazo e duplicidade.
create or replace function public.registrar_presenca(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_aula public.aulas%rowtype;
  v_turma public.turmas%rowtype;
  v_perfil public.profiles%rowtype;
  v_presenca public.presencas%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('status', 'nao_autenticado');
  end if;

  select * into v_perfil from public.profiles where id = v_user;
  if not found or v_perfil.tipo <> 'aluno' then
    return jsonb_build_object('status', 'perfil_invalido');
  end if;

  select * into v_aula from public.aulas where token = p_token;
  if not found then
    return jsonb_build_object('status', 'token_invalido');
  end if;

  select * into v_turma from public.turmas where id = v_aula.turma_id;

  if not v_aula.ativa then
    return jsonb_build_object('status', 'aula_encerrada');
  end if;

  if v_aula.expira_em <= now() then
    return jsonb_build_object('status', 'token_expirado');
  end if;

  if not exists (
    select 1 from public.matriculas
    where turma_id = v_aula.turma_id and aluno_id = v_user
  ) then
    return jsonb_build_object('status', 'nao_matriculado');
  end if;

  select * into v_presenca
  from public.presencas
  where aula_id = v_aula.id and aluno_id = v_user;

  if found then
    return jsonb_build_object(
      'status', 'ja_registrada',
      'disciplina', v_turma.disciplina,
      'turma', v_turma.nome,
      'data_hora', v_aula.data_hora,
      'registrado_em', v_presenca.registrado_em
    );
  end if;

  insert into public.presencas (aula_id, aluno_id)
  values (v_aula.id, v_user)
  returning * into v_presenca;

  return jsonb_build_object(
    'status', 'registrada',
    'disciplina', v_turma.disciplina,
    'turma', v_turma.nome,
    'data_hora', v_aula.data_hora,
    'registrado_em', v_presenca.registrado_em
  );
end;
$$;

revoke all on function public.registrar_presenca(uuid) from public;
grant execute on function public.registrar_presenca(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.turmas enable row level security;
alter table public.matriculas enable row level security;
alter table public.aulas enable row level security;
alter table public.presencas enable row level security;

-- Perfis: leitura por usuários autenticados para permitir matrícula por e-mail.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Turmas
drop policy if exists "turmas_select_members" on public.turmas;
create policy "turmas_select_members"
on public.turmas for select
to authenticated
using (professor_id = auth.uid() or public.is_aluno_da_turma(id));

drop policy if exists "turmas_insert_professor" on public.turmas;
create policy "turmas_insert_professor"
on public.turmas for insert
to authenticated
with check (
  professor_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tipo = 'professor')
);

drop policy if exists "turmas_update_professor" on public.turmas;
create policy "turmas_update_professor"
on public.turmas for update
to authenticated
using (professor_id = auth.uid())
with check (professor_id = auth.uid());

drop policy if exists "turmas_delete_professor" on public.turmas;
create policy "turmas_delete_professor"
on public.turmas for delete
to authenticated
using (professor_id = auth.uid());

-- Matrículas
drop policy if exists "matriculas_select_members" on public.matriculas;
create policy "matriculas_select_members"
on public.matriculas for select
to authenticated
using (aluno_id = auth.uid() or public.is_professor_da_turma(turma_id));

drop policy if exists "matriculas_insert_professor" on public.matriculas;
create policy "matriculas_insert_professor"
on public.matriculas for insert
to authenticated
with check (public.is_professor_da_turma(turma_id));

drop policy if exists "matriculas_delete_professor" on public.matriculas;
create policy "matriculas_delete_professor"
on public.matriculas for delete
to authenticated
using (public.is_professor_da_turma(turma_id));

-- Aulas
drop policy if exists "aulas_select_members" on public.aulas;
create policy "aulas_select_members"
on public.aulas for select
to authenticated
using (public.is_professor_da_turma(turma_id) or public.is_aluno_da_turma(turma_id));

drop policy if exists "aulas_insert_professor" on public.aulas;
create policy "aulas_insert_professor"
on public.aulas for insert
to authenticated
with check (public.is_professor_da_turma(turma_id));

drop policy if exists "aulas_update_professor" on public.aulas;
create policy "aulas_update_professor"
on public.aulas for update
to authenticated
using (public.is_professor_da_turma(turma_id))
with check (public.is_professor_da_turma(turma_id));

drop policy if exists "aulas_delete_professor" on public.aulas;
create policy "aulas_delete_professor"
on public.aulas for delete
to authenticated
using (public.is_professor_da_turma(turma_id));

-- Presenças: aluno lê as próprias e professor lê as da própria aula.
drop policy if exists "presencas_select_members" on public.presencas;
create policy "presencas_select_members"
on public.presencas for select
to authenticated
using (aluno_id = auth.uid() or public.is_professor_da_aula(aula_id));

-- A inserção normal é bloqueada; o aluno registra somente via registrar_presenca().
-- Isso centraliza todas as validações do QR no banco.
