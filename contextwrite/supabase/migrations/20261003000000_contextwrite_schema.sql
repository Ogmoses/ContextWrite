-- ContextWrite: complete database setup (tables, security rules, storage, admin stats).
-- Run once in a NEW Supabase project: SQL Editor > paste > Run. The live project was built from the same steps.
create extension if not exists pgcrypto;
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;

create table public.users (id uuid primary key references auth.users(id) on delete cascade, email text, name text, is_admin boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.settings (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.users(id) on delete cascade, settings_json jsonb not null default '{}'::jsonb);
create table public.projects (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, title text not null default 'Untitled', writing_type text, status text not null default 'context' check (status in ('context','summary','draft','final')), initial_description text, writing_language text default 'en', regional_variant text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.project_context (id uuid primary key default gen_random_uuid(), project_id uuid not null unique references public.projects(id) on delete cascade, context_json jsonb not null default '{}'::jsonb, completeness_json jsonb not null default '{}'::jsonb, strategy_json jsonb, updated_at timestamptz not null default now());
create table public.context_answers (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, question_id text, question_text text not null, answer text, source text not null default 'user' check (source in ('user','skipped','upload','inferred')), confidence numeric, created_at timestamptz not null default now());
create table public.voice_profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, name text not null default 'My voice', profile_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.writing_samples (id uuid primary key default gen_random_uuid(), voice_profile_id uuid not null references public.voice_profiles(id) on delete cascade, content text not null, created_at timestamptz not null default now());
create table public.drafts (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, version_number int not null, name text, content text not null, generation_metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique (project_id, version_number));
create table public.documents (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, filename text not null, storage_path text not null, extracted_text text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table public.ai_usage (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, request_type text not null, model text, input_tokens int, output_tokens int, estimated_cost numeric, created_at timestamptz not null default now());
create table public.audit_log (id uuid primary key default gen_random_uuid(), actor_id uuid, action text not null, target text, created_at timestamptz not null default now());
create table public.user_ai_settings (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.users(id) on delete cascade, provider text not null check (provider in ('anthropic','openai','gemini','openai_compatible')), base_url text, model_fast text not null, model_strong text not null, model_vision text, encrypted_key text not null, key_hint text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (provider <> 'openai_compatible' or base_url is not null));
create table public.app_errors (id uuid primary key default gen_random_uuid(), route text not null, kind text not null, created_at timestamptz not null default now());
create table public.feedback (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, kind text not null check (kind in ('testimonial','suggestion','problem')), message text not null check (char_length(message) between 5 and 2000), ok_to_publish boolean not null default false, status text not null default 'new' check (status in ('new','done')), created_at timestamptz not null default now());

create index projects_user_updated_idx on public.projects(user_id, updated_at desc);
create index context_answers_project_idx on public.context_answers(project_id, created_at);
create index voice_profiles_user_idx on public.voice_profiles(user_id);
create index writing_samples_vp_idx on public.writing_samples(voice_profile_id);
create index documents_project_idx on public.documents(project_id);
create index ai_usage_user_idx on public.ai_usage(user_id, created_at desc);
create index ai_usage_project_idx on public.ai_usage(project_id);
create index app_errors_created_idx on public.app_errors(created_at desc);
create index feedback_created_idx on public.feedback(created_at desc);
create index feedback_user_idx on public.feedback(user_id);
create trigger trg_users_upd before update on public.users for each row execute function public.set_updated_at();
create trigger trg_projects_upd before update on public.projects for each row execute function public.set_updated_at();
create trigger trg_pctx_upd before update on public.project_context for each row execute function public.set_updated_at();
create trigger trg_voice_upd before update on public.voice_profiles for each row execute function public.set_updated_at();
create trigger trg_user_ai_settings_upd before update on public.user_ai_settings for each row execute function public.set_updated_at();

-- Ownership helpers used by the security rules.
create or replace function public.owns_project(pid uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists (select 1 from public.projects p where p.id = pid and p.user_id = auth.uid()); $$;
create or replace function public.owns_voice(vid uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists (select 1 from public.voice_profiles v where v.id = vid and v.user_id = auth.uid()); $$;
revoke execute on function public.owns_project(uuid), public.owns_voice(uuid) from public, anon;
grant execute on function public.owns_project(uuid), public.owns_voice(uuid) to authenticated;

-- Row-level security: every table locked; users see only their own rows.
alter table public.users enable row level security; alter table public.settings enable row level security; alter table public.projects enable row level security; alter table public.project_context enable row level security; alter table public.context_answers enable row level security; alter table public.voice_profiles enable row level security; alter table public.writing_samples enable row level security; alter table public.drafts enable row level security; alter table public.documents enable row level security; alter table public.ai_usage enable row level security; alter table public.audit_log enable row level security; alter table public.user_ai_settings enable row level security; alter table public.app_errors enable row level security; alter table public.feedback enable row level security;
create policy users_self_select on public.users for select to authenticated using (id = (select auth.uid()));
create policy users_self_update on public.users for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy users_self_delete on public.users for delete to authenticated using (id = (select auth.uid()));
create policy settings_own on public.settings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy projects_own on public.projects for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy pctx_own on public.project_context for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy answers_own on public.context_answers for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy voice_own on public.voice_profiles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy samples_own on public.writing_samples for all to authenticated using (public.owns_voice(voice_profile_id)) with check (public.owns_voice(voice_profile_id));
create policy drafts_own on public.drafts for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy documents_own on public.documents for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy usage_read_own on public.ai_usage for select to authenticated using (user_id = (select auth.uid()));
create policy ai_settings_own on public.user_ai_settings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy feedback_insert_own on public.feedback for insert to authenticated with check (user_id = (select auth.uid()));
create policy feedback_select_own on public.feedback for select to authenticated using (user_id = (select auth.uid()));
-- audit_log and app_errors have no policies on purpose: only the server (service role) can touch them.

-- Column-level limits: nobody can grant themselves admin; the encrypted AI key is never readable from the browser.
revoke update on public.users from authenticated; grant update (name) on public.users to authenticated;
revoke all on public.user_ai_settings from anon, authenticated;
grant select (id, user_id, provider, base_url, model_fast, model_strong, model_vision, key_hint, created_at, updated_at) on public.user_ai_settings to authenticated;
grant delete on public.user_ai_settings to authenticated;
revoke update, delete on public.feedback from authenticated;

-- Create the profile and settings rows when someone signs up.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  insert into public.settings (user_id, settings_json) values (new.id, '{}'::jsonb);
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Private storage for uploaded documents, one folder per user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('documents','documents', false, 10485760, array['application/pdf','text/plain','text/markdown','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','image/webp']) on conflict (id) do nothing;
create policy docs_bucket_own on storage.objects for all to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Counts only (never writing) for the admin dashboard.
create or replace function public.admin_stats() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'users_total', (select count(*) from public.users),
    'users_7d', (select count(*) from public.users where created_at > now() - interval '7 days'),
    'projects_total', (select count(*) from public.projects),
    'projects_7d', (select count(*) from public.projects where created_at > now() - interval '7 days'),
    'drafts_total', (select count(*) from public.drafts),
    'documents_total', (select count(*) from public.documents),
    'voice_profiles_total', (select count(*) from public.voice_profiles),
    'storage_bytes', coalesce((select sum((metadata->>'size')::bigint) from storage.objects where bucket_id = 'documents'), 0),
    'ai_total', (select count(*) from public.ai_usage),
    'ai_7d', (select count(*) from public.ai_usage where created_at > now() - interval '7 days'),
    'active_users_7d', (select count(distinct user_id) from public.ai_usage where created_at > now() - interval '7 days'),
    'ai_by_type', (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (select request_type k, count(*) c from public.ai_usage where created_at > now() - interval '30 days' group by 1) x),
    'ai_by_model', (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (select coalesce(model, 'unknown') k, count(*) c from public.ai_usage where created_at > now() - interval '30 days' group by 1) x),
    'providers', (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (select provider k, count(*) c from public.user_ai_settings group by 1) x),
    'errors_7d', (select count(*) from public.app_errors where created_at > now() - interval '7 days' and kind not in ('no_ai','no_vision')),
    'config_issues_7d', (select count(*) from public.app_errors where created_at > now() - interval '7 days' and kind in ('no_ai','no_vision')),
    'errors_by_route', (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (select route k, count(*) c from public.app_errors where created_at > now() - interval '7 days' and kind not in ('no_ai','no_vision') group by 1) x),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'ai', ai, 'projects', pr) order by d), '[]'::jsonb) from (select g::date d, (select count(*) from public.ai_usage where created_at::date = g::date) ai, (select count(*) from public.projects where created_at::date = g::date) pr from generate_series(current_date - 13, current_date, interval '1 day') g) x));
$$;
revoke execute on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;
