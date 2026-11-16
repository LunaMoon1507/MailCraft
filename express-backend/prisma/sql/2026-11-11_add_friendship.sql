-- Adds the friends list (PBI #10 / SCRUM-41).
-- Run once in Supabase → SQL Editor, then from express-backend/: npx prisma generate
--
-- Each friendship is stored as TWO rows, (A, B) and (B, A), so "list my friends"
-- is a simple lookup on user_id. Adding/removing a friend always writes both rows.

CREATE TABLE public."Friendship" (
  user_id    bigint       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id  bigint       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp(6) NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CONSTRAINT friendship_not_self CHECK (user_id <> friend_id)
);

CREATE INDEX "Friendship_friend_id_idx" ON public."Friendship" (friend_id);

-- Same as the other tables: block Supabase's public API from reading it.
-- The backend connects as the database owner, so this doesn't affect it.
ALTER TABLE public."Friendship" ENABLE ROW LEVEL SECURITY;
