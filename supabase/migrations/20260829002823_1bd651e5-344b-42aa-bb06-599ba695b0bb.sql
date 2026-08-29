-- roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- site content
create table public.site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.site_content to anon;
grant select, insert, update, delete on public.site_content to authenticated;
grant all on public.site_content to service_role;
alter table public.site_content enable row level security;
create policy "content public read" on public.site_content for select to anon, authenticated using (true);
create policy "admin writes content" on public.site_content for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger site_content_updated before update on public.site_content for each row execute function public.set_updated_at();

-- skills
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  group_key text not null,
  title text not null,
  description text not null default '',
  level int not null default 3,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.skills to anon;
grant select, insert, update, delete on public.skills to authenticated;
grant all on public.skills to service_role;
alter table public.skills enable row level security;
create policy "skills public read" on public.skills for select to anon, authenticated using (true);
create policy "admin writes skills" on public.skills for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger skills_updated before update on public.skills for each row execute function public.set_updated_at();

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  front_url text,
  back_url text,
  demo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "projects public read" on public.projects for select to anon, authenticated using (true);
create policy "admin writes projects" on public.projects for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();

-- contact messages
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon;
grant select, insert, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "anyone can send message" on public.contact_messages for insert to anon, authenticated with check (
  length(name) between 1 and 120 and length(email) between 3 and 200 and length(message) between 1 and 4000
);
create policy "admin reads messages" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin deletes messages" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- seed content
insert into public.site_content (key, value) values
  ('playerName', 'Lucas Amaral'),
  ('tagline', 'Técnico em Desenvolvimento de Sistemas — SENAI Criciúma'),
  ('heroSub', 'Um portfólio em pixel art. Explore a cidade e entre nas construções.'),
  ('homeClass', 'Dev Full Stack Jr.'),
  ('homeOrigin', 'Criciúma, SC'),
  ('homeFocus', 'Web, apps e banco de dados'),
  ('homeMode', 'Aprender construindo'),
  ('aboutIntro', 'Olá! Sou Lucas, estudante de Desenvolvimento de Sistemas. Gosto de resolver problemas com tecnologia e criar interfaces bem cuidadas.'),
  ('aboutStory', 'Escolhi Desenvolvimento de Sistemas porque gosto de entender como as coisas funcionam por dentro. Hoje estudo no SENAI Criciúma e construo projetos web de ponta a ponta: interface, API e banco de dados.'),
  ('aboutSeeking', 'Estou em busca de estágio ou primeira oportunidade como desenvolvedor, presencial em Criciúma ou remoto.'),
  ('aboutHobby', 'Fora do código: jogos, pixel art e aprender coisas novas construindo pequenos projetos.'),
  ('skillsIntro', 'Competências do curso Técnico em Desenvolvimento de Sistemas — SENAI Criciúma.'),
  ('projectsIntro', 'Projetos do meu GitHub mostrando front-end, back-end e banco de dados.'),
  ('contactIntro', 'Vamos conversar sobre estágio, projetos ou colaboração?'),
  ('contactEmail', 'seuemail@exemplo.com'),
  ('contactLinkedin', 'https://www.linkedin.com/'),
  ('contactGithub', 'https://github.com/Lucas-Amaral-dom'),
  ('contactCity', 'Criciúma, Santa Catarina');

insert into public.skills (group_key, title, description, level, sort_order) values
  ('base', 'Base de programação', 'Algoritmos, lógica, versionamento com Git, estruturação de código e resolução de problemas.', 4, 1),
  ('web', 'Web e interfaces', 'HTML, CSS, JavaScript, protótipos, acessibilidade, responsividade e sistemas web.', 4, 2),
  ('data', 'Dados e backend', 'Banco de dados, modelagem, CRUD, APIs REST, regras de negócio e integração de sistemas.', 3, 3),
  ('quality', 'Qualidade e entrega', 'Testes, implantação, manutenção, documentação e gestão de projetos.', 3, 4);

insert into public.projects (title, description, tags, front_url, back_url, sort_order) values
  ('Biblioteca', 'Sistema dividido em front-end e back-end para organizar uma biblioteca com cadastro, listagem e consulta de acervo.', array['Front-end','Back-end','CRUD'], 'https://github.com/Lucas-Amaral-dom/biblioteca-front', 'https://github.com/Lucas-Amaral-dom/biblioteca-back-', 1),
  ('Projeto Guarda-vidas', 'Solução com repositórios de interface e back-end para apoiar o trabalho de guarda-vidas, com API e sistema web.', array['API','Sistema web','Equipe'], 'https://github.com/Lucas-Amaral-dom/projeto_guardavidas', 'https://github.com/Lucas-Amaral-dom/projeto-guardavidas-Back', 2),
  ('Portfólio RPG', 'Este portfólio: um jogo 2D em pixel art estilo Pokémon onde cada construção guarda uma parte da minha trajetória.', array['Kaplay','React','Game'], 'https://github.com/Lucas-Amaral-dom/portfolio', null, 3);