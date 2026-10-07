-- Data-isolation test. Run in the SQL Editor of a project that already has the schema.
-- It makes two fake users inside a transaction, tries to break the rules as user B, and always rolls back.
-- The final "error" is deliberate: it carries the results. Every line should start with "ok" (or "control").
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); p uuid; n int; t text; res text[] := '{}';
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (a,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','iso-a@test.invalid','{}','{}',now(),now()),
         (b,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','iso-b@test.invalid','{}','{}',now(),now());
  insert into public.projects (user_id,title) values (a,'A secret') returning id into p;
  insert into public.project_context(project_id) values (p);
  insert into public.context_answers(project_id,question_text,answer) values (p,'q','secret');
  insert into public.drafts(project_id,version_number,content) values (p,1,'secret draft');
  insert into public.documents(project_id,filename,storage_path) values (p,'f','x');
  insert into public.voice_profiles(user_id) values (a);
  insert into public.user_ai_settings(user_id,provider,model_fast,model_strong,encrypted_key) values (a,'gemini','m','m','secret');
  insert into public.feedback(user_id,kind,message) values (a,'problem','secret message');
  insert into public.ai_usage(user_id,request_type) values (a,'t');
  insert into public.audit_log(action) values ('x');
  insert into public.app_errors(route,kind) values ('r','k');
  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role','authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.projects where id = p; res := array_append(res, 'control: A sees own project = ' || n || ' (want 1)');
  begin perform encrypted_key from public.user_ai_settings where user_id = a; res := array_append(res, 'FAIL: A can read encrypted_key');
  exception when others then res := array_append(res, 'ok: encrypted_key unreadable even by its owner'); end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role','authenticated')::text, true);
  execute 'set local role authenticated';
  foreach t in array array['projects','project_context','context_answers','drafts','documents','voice_profiles','user_ai_settings','feedback','ai_usage','audit_log','app_errors'] loop
    begin execute format('select count(*) from public.%I', t) into n; res := array_append(res, (case when n = 0 then 'ok' else 'FAIL' end) || ': B sees ' || n || ' rows of ' || t || ' (want 0)');
    exception when others then res := array_append(res, 'ok: B blocked from ' || t); end;
  end loop;
  select count(*) into n from public.users where id <> b; res := array_append(res, (case when n = 0 then 'ok' else 'FAIL' end) || ': B sees ' || n || ' other users (want 0)');
  update public.projects set title = 'hacked' where id = p; get diagnostics n = row_count; res := array_append(res, (case when n = 0 then 'ok' else 'FAIL' end) || ': B updated ' || n || ' of A projects');
  delete from public.projects where id = p; get diagnostics n = row_count; res := array_append(res, (case when n = 0 then 'ok' else 'FAIL' end) || ': B deleted ' || n || ' of A projects');
  begin insert into public.projects(user_id,title) values (a,'x'); res := array_append(res, 'FAIL: B created a project as A'); exception when others then res := array_append(res, 'ok: B cannot create projects as A'); end;
  begin insert into public.drafts(project_id,version_number,content) values (p,2,'x'); res := array_append(res, 'FAIL: B wrote into A project'); exception when others then res := array_append(res, 'ok: B cannot write into A project'); end;
  begin update public.users set is_admin = true where id = b; res := array_append(res, 'FAIL: B made themselves admin'); exception when others then res := array_append(res, 'ok: B cannot grant themselves admin'); end;
  begin insert into storage.objects(bucket_id,name,owner) values ('documents', a::text || '/x.txt', b); res := array_append(res, 'FAIL: B uploaded into A folder'); exception when others then res := array_append(res, 'ok: B cannot upload into A folder'); end;
  reset role;
  execute 'set local role anon';
  begin select count(*) into n from public.projects; res := array_append(res, (case when n = 0 then 'ok' else 'FAIL' end) || ': logged-out sees ' || n || ' projects (want 0)');
  exception when others then res := array_append(res, 'ok: logged-out blocked from projects'); end;
  reset role;
  raise exception E'ISOLATION RESULTS (rolled back)\n%', array_to_string(res, E'\n');
end $$;
