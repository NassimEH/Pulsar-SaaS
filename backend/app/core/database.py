from supabase import create_client, Client
from app.core.config import settings

# Créer le client Supabase
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

print(f"✅ Client Supabase configuré (URL: {settings.SUPABASE_URL[:30]}...)")

# Fonction pour obtenir le client Supabase
def get_supabase() -> Client:
    """Retourne le client Supabase"""
    return supabase

# Fonction pour initialiser les tables (si nécessaire)
# Note: Avec Supabase, les tables sont généralement créées via le dashboard ou migrations
def init_db():
    """Initialise la base de données Supabase"""
    try:
        # Tester la connexion en faisant une requête simple
        # Vérifier si la table users existe
        result = supabase.table("users").select("id").limit(1).execute()
        print("✅ Connexion à Supabase réussie")
        print("✅ Table 'users' accessible")
    except Exception as e:
        # Si la table n'existe pas, c'est normal au premier démarrage
        error_msg = str(e)
        error_dict = e.args[0] if e.args and isinstance(e.args[0], dict) else {}
        error_code = error_dict.get('code', '')
        error_message = error_dict.get('message', str(e))
        
        if error_code == 'PGRST205' or "could not find the table" in error_message.lower() or "does not exist" in error_msg.lower():
            print("⚠️  Table 'users' n'existe pas encore dans Supabase")
            print("   Créez la table via le dashboard Supabase (Table Editor)")
            print("   Structure requise:")
            print("     - id: int8 (Primary Key, Auto-increment)")
            print("     - email: text (Unique, Not null)")
            print("     - hashed_password: text (Not null)")
            print("     - full_name: text (Nullable)")
            print("     - is_active: bool (Default: true)")
            print("     - is_verified: bool (Default: false)")
            print("     - plan: text (Default: 'free')")
            print("     - created_at: timestamptz (Default: now())")
            print("     - updated_at: timestamptz (Default: now())")
            # Ne pas lever d'erreur, juste un avertissement
            return
        else:
            print(f"❌ Erreur lors de la connexion à Supabase: {e}")
            print(f"   Vérifiez que SUPABASE_URL et SUPABASE_KEY sont corrects dans le fichier .env")
            # Pour les autres erreurs, on peut continuer aussi (connexion OK mais problème de table)
            print("   ⚠️  Le serveur démarre quand même, mais certaines fonctionnalités peuvent ne pas fonctionner")
            return
