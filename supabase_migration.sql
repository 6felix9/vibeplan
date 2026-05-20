-- Create saved_activities table to store user shortlists
CREATE TABLE IF NOT EXISTS public.saved_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  session_id text NOT NULL,
  deal_id text REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(session_id, deal_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saved_activities ENABLE ROW LEVEL SECURITY;

-- Allow public select/read access
CREATE POLICY "Allow public read of saved activities" 
  ON public.saved_activities FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert of saved activities" 
  ON public.saved_activities FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Allow public delete of saved activities" 
  ON public.saved_activities FOR DELETE 
  TO anon, authenticated 
  USING (true);
