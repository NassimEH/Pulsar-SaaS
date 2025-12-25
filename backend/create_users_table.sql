-- Script SQL pour créer la table users dans Supabase
-- Exécutez ce script dans le SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'studio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes par email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Désactiver Row Level Security (RLS) pour permettre les opérations serveur
-- ⚠️ IMPORTANT : RLS est désactivé car nous utilisons la clé service_role côté serveur
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Commentaires pour la documentation
COMMENT ON TABLE public.users IS 'Table des utilisateurs de l''application';
COMMENT ON COLUMN public.users.id IS 'Identifiant unique de l''utilisateur';
COMMENT ON COLUMN public.users.email IS 'Email de l''utilisateur (unique)';
COMMENT ON COLUMN public.users.hashed_password IS 'Mot de passe hashé (bcrypt)';
COMMENT ON COLUMN public.users.full_name IS 'Nom complet de l''utilisateur';
COMMENT ON COLUMN public.users.is_active IS 'Indique si le compte est actif';
COMMENT ON COLUMN public.users.is_verified IS 'Indique si l''email est vérifié';
COMMENT ON COLUMN public.users.plan IS 'Plan d''abonnement (free, starter, pro, studio)';
COMMENT ON COLUMN public.users.created_at IS 'Date de création du compte';
COMMENT ON COLUMN public.users.updated_at IS 'Date de dernière modification';

