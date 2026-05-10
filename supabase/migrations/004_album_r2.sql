-- supabase/migrations/004_album_r2.sql

-- Função auxiliar de incremento (usada no contador de unlock_count)
create or replace function public.increment(x integer)
returns integer language sql immutable as $$
  select x + 1
$$;

-- Índice para buscar fotos desbloqueadas pelo usuário rapidamente
create index if not exists idx_unlocks_user_photo
  on public.photo_unlocks(user_id, photo_id);

-- Índice para ordenação do álbum
create index if not exists idx_photos_creator_sort
  on public.album_photos(creator_id, sort_order desc);

-- View auxiliar: fotos com info de desbloqueio para um usuário
-- Usada pelo frontend para montar o álbum com estado correto
create or replace function public.get_creator_album(
  p_creator_id uuid,
  p_user_id    uuid
) returns table (
  id           uuid,
  r2_key       text,
  r2_key_blur  text,
  blur_hash    text,
  is_free      boolean,
  price_petals integer,
  unlock_count integer,
  sort_order   integer,
  is_unlocked  boolean
) language sql security definer as $$
  select
    p.id,
    p.r2_key,
    p.r2_key_blur,
    p.blur_hash,
    p.is_free,
    p.price_petals,
    p.unlock_count,
    p.sort_order,
    -- foto está desbloqueada se: é grátis, ou usuário desbloqueou, ou tem VIP ativo
    (
      p.is_free
      or exists(
        select 1 from public.photo_unlocks u
        where u.photo_id = p.id and u.user_id = p_user_id
      )
      or exists(
        select 1 from public.vip_subscriptions v
        where v.creator_id = p_creator_id
          and v.user_id    = p_user_id
          and v.active     = true
          and v.ends_at    > now()
      )
    ) as is_unlocked
  from public.album_photos p
  where p.creator_id = p_creator_id
  order by p.sort_order desc;
$$;

-- Reordena fotos (drag-and-drop no dashboard da criadora)
create or replace function public.reorder_photos(
  p_creator_id uuid,
  p_photo_ids  uuid[]   -- ordem nova: primeiro = mais alto na tela
) returns void language plpgsql security definer as $$
declare
  v_idx integer := 0;
  v_id  uuid;
begin
  foreach v_id in array p_photo_ids loop
    update public.album_photos
    set sort_order = array_length(p_photo_ids, 1) - v_idx
    where id = v_id and creator_id = p_creator_id;
    v_idx := v_idx + 1;
  end loop;
end;
$$;
