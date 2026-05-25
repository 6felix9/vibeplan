-- Enable pgvector
create extension if not exists vector;

-- Deals table
create table if not exists deals (
  id               text primary key,
  title            text not null,
  category         text,
  description      text,
  image_url        text,
  price            text,
  price_amount     float8,
  time_info        text,
  location         text,
  discount         text,
  discount_amount  float8,
  vibe             text,
  tags             text[],
  source           text,
  source_link      text,
  source_url       text,
  channel_name     text,
  message_id       bigint,
  expiry_at        timestamptz,
  refreshed_at     timestamptz,
  lat              float8,
  lng              float8,
  best_time        text,
  embedding_text   text,
  embedding_model  text,
  embedding        vector(1536)
);

-- Index for fast ANN search
create index if not exists deals_embedding_idx
  on deals using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Semantic search function called by the itinerary pipeline
create or replace function match_deals(
  query_embedding   vector(1536),
  match_count       int      default 8,
  match_threshold   float    default 0.12,
  filter_categories text[]   default null,
  filter_area       text     default null,
  filter_max_price  float8   default null
)
returns setof deals
language sql stable
as $$
  select deals.*
  from deals
  where
    -- only return deals that haven't expired and have an embedding
    (expiry_at is null or expiry_at > now())
    and embedding is not null
    -- cosine similarity threshold
    and 1 - (deals.embedding <=> query_embedding) >= match_threshold
    -- optional filters
    and (filter_categories is null or deals.category = any(filter_categories))
    and (filter_area       is null or deals.location ilike '%' || filter_area || '%')
    and (filter_max_price  is null or deals.price_amount <= filter_max_price)
  order by deals.embedding <=> query_embedding
  limit match_count;
$$;
