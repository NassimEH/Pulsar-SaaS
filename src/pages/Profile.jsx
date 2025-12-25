import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Section from "../components/Section";
import Button from "../components/Button";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, logout, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalProcessed: 0,
    totalAnalyzed: 0
  });
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone: "",
    location: "",
    website: ""
  });
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [preferences, setPreferences] = useState({
    theme: "dark",
    language: "fr",
    email_notifications: true,
    push_notifications: false
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        bio: user.bio || "",
        phone: user.phone || "",
        location: user.location || "",
        website: user.website || ""
      });
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`);
      }
    }
  }, [user]);

  const menuItems = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "settings", label: "Paramètres" },
    { id: "security", label: "Sécurité" },
    { id: "preferences", label: "Préférences" },
    { id: "usage", label: "Utilisation" },
    { id: "billing", label: "Facturation" },
  ];

  const getPlanBadgeColor = (plan) => {
    const colors = {
      free: "bg-n-6 text-n-1",
      starter: "bg-color-1/20 text-color-1 border border-color-1/50",
      pro: "bg-color-5/20 text-color-5 border border-color-5/50",
      studio: "bg-color-6/20 text-color-6 border border-color-6/50"
    };
    return colors[plan] || colors.free;
  };

  const getPlanName = (plan) => {
    const names = {
      free: "Gratuit",
      starter: "Starter",
      pro: "Pro",
      studio: "Studio"
    };
    return names[plan] || "Gratuit";
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valider le type de fichier
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image");
      return;
    }

    // Valider la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop volumineuse (maximum 5MB)");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("http://localhost:8000/api/auth/me/avatar", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erreur lors de l'upload");
      }

      const data = await response.json();
      setAvatarPreview(`http://localhost:8000${data.avatar_url}`);
      if (refreshUser) {
        await refreshUser();
      }
      alert("Photo de profil mise à jour avec succès");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("http://localhost:8000/api/auth/me", {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erreur lors de la mise à jour");
      }

      if (refreshUser) {
        await refreshUser();
      }
      alert("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.new_password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("http://localhost:8000/api/auth/me/password", {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erreur lors du changement de mot de passe");
      }

      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: ""
      });
      alert("Mot de passe changé avec succès");
    } catch (error) {
      console.error("Error changing password:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    // Pour l'instant, on sauvegarde dans localStorage
    // Plus tard, on pourra ajouter un endpoint backend
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    alert("Préférences sauvegardées");
  };

  if (loading) {
    return (
      <>
        <Header />
        <Section className="pt-32 pb-16">
          <div className="container">
            <div className="text-center text-n-1">Chargement...</div>
          </div>
        </Section>
        <Footer />
      </>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Plans disponibles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-color-1/10 to-color-5/10 blur-2xl opacity-50" />
                <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-2xl p-6">
                  <div className="text-n-3 text-sm font-code mb-2">Starter</div>
                  <div className="text-2xl font-bold text-n-1 mb-2">9.99€/mois</div>
                  <div className="text-n-4 text-xs mb-4">Effets avancés, support prioritaire</div>
                  <Button className="w-full text-sm py-2">Upgrade</Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-color-5/10 to-color-6/10 blur-2xl opacity-50" />
                <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-2xl p-6">
                  <div className="text-n-3 text-sm font-code mb-2">Pro</div>
                  <div className="text-2xl font-bold text-n-1 mb-2">19.99€/mois</div>
                  <div className="text-n-4 text-xs mb-4">Tous les effets, exports illimités</div>
                  <Button className="w-full text-sm py-2">Upgrade</Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-color-6/10 to-color-1/10 blur-2xl opacity-50" />
                <div className="relative bg-n-8/50 backdrop-blur-sm border-2 border-color-6/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-n-3 text-sm font-code">Studio</div>
                    <span className="px-2 py-1 rounded text-xs font-code bg-color-6/20 text-color-6 border border-color-6/50">
                      Actuel
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-n-1 mb-2">Sur mesure</div>
                  <div className="text-n-4 text-xs mb-4">Solution complète pour professionnels</div>
                  <Button className="w-full text-sm py-2 bg-n-6 hover:bg-n-7">Gérer</Button>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-color-1/10 via-color-5/10 to-color-6/10 blur-3xl opacity-30" />
              <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-8">
                <h3 className="h4 mb-6">Vos statistiques</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-n-3 text-sm font-code mb-2">Fichiers uploadés</div>
                    <div className="text-3xl font-bold text-n-1">{stats.totalUploads}</div>
                  </div>
                  <div>
                    <div className="text-n-3 text-sm font-code mb-2">Fichiers traités</div>
                    <div className="text-3xl font-bold text-n-1">{stats.totalProcessed}</div>
                  </div>
                  <div>
                    <div className="text-n-3 text-sm font-code mb-2">Analyses effectuées</div>
                    <div className="text-3xl font-bold text-n-1">{stats.totalAnalyzed}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-color-1/10 via-color-5/10 to-color-6/10 blur-3xl opacity-30" />
              <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-8">
                <h3 className="h4 mb-6">Paramètres du compte</h3>
                
                {/* Photo de profil */}
                <div className="mb-6">
                  <label className="block text-n-3 text-sm font-code mb-3">Photo de profil</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-24 h-24 rounded-full object-cover border-2 border-n-6"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-color-1 to-color-5 flex items-center justify-center text-2xl font-bold text-n-1 border-2 border-n-6">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-n-8/80 rounded-full flex items-center justify-center">
                          <div className="text-n-1 text-xs">Chargement...</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                        disabled={uploadingAvatar}
                      />
                      <label
                        htmlFor="avatar-upload"
                        className={`inline-block px-4 py-2 rounded-lg text-sm font-code cursor-pointer transition-colors ${
                          uploadingAvatar
                            ? "bg-n-7 text-n-4 cursor-not-allowed"
                            : "bg-color-1/20 text-color-1 border border-color-1/50 hover:bg-color-1/30"
                        }`}
                      >
                        {uploadingAvatar ? "Chargement..." : "Changer la photo"}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1"
                    />
                    <p className="text-n-4 text-xs mt-1">L'email ne peut pas être modifié</p>
                  </div>

                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Nom complet</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1 resize-none"
                      rows="4"
                      placeholder="Parlez-nous de vous..."
                      maxLength={500}
                    />
                    <p className="text-n-4 text-xs mt-1">{formData.bio.length}/500 caractères</p>
                  </div>

                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>

                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Localisation</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                      placeholder="Paris, France"
                    />
                  </div>

                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Site web</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Plan actuel</label>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-lg text-sm font-code ${getPlanBadgeColor(user.plan)}`}>
                        {getPlanName(user.plan)}
                      </span>
                      <Button onClick={() => navigate('/#pricing')}>
                        Changer de plan
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-color-1/10 via-color-5/10 to-color-6/10 blur-3xl opacity-30" />
              <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-8">
                <h3 className="h4 mb-6">Sécurité</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-n-1 font-code mb-4">Changer le mot de passe</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-n-3 text-sm font-code mb-2">Ancien mot de passe</label>
                        <input
                          type="password"
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                          className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                        />
                      </div>
                      <div>
                        <label className="block text-n-3 text-sm font-code mb-2">Nouveau mot de passe</label>
                        <input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                        />
                      </div>
                      <div>
                        <label className="block text-n-3 text-sm font-code mb-2">Confirmer le nouveau mot de passe</label>
                        <input
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                        />
                      </div>
                      <Button onClick={handleChangePassword} disabled={saving}>
                        {saving ? "Changement en cours..." : "Changer le mot de passe"}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-n-6">
                    <h4 className="text-n-1 font-code mb-4">Authentification à deux facteurs</h4>
                    <p className="text-n-3 text-sm mb-4">Sécurisez votre compte avec une authentification à deux facteurs.</p>
                    <Button className="bg-n-6 hover:bg-n-7">
                      Activer 2FA
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-n-6">
                    <h4 className="text-n-1 font-code mb-4">Sessions actives</h4>
                    <p className="text-n-3 text-sm mb-4">Gérez vos sessions actives et déconnectez-vous des appareils distants.</p>
                    <Button className="bg-n-6 hover:bg-n-7">
                      Voir les sessions
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-color-1/10 via-color-5/10 to-color-6/10 blur-3xl opacity-30" />
              <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-8">
                <h3 className="h4 mb-6">Préférences</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Thème</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                    >
                      <option value="dark">Sombre</option>
                      <option value="light">Clair</option>
                      <option value="auto">Automatique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-n-3 text-sm font-code mb-2">Langue</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 focus:outline-none focus:border-color-1"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-n-6">
                    <h4 className="text-n-1 font-code mb-4">Notifications</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email_notifications}
                          onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                          className="w-5 h-5 rounded bg-n-7 border border-n-6 text-color-1 focus:ring-color-1"
                        />
                        <span className="text-n-1 text-sm">Notifications par email</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.push_notifications}
                          onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
                          className="w-5 h-5 rounded bg-n-7 border border-n-6 text-color-1 focus:ring-color-1"
                        />
                        <span className="text-n-1 text-sm">Notifications push</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSavePreferences}>
                      Enregistrer les préférences
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "usage":
        return (
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-color-1/10 via-color-5/10 to-color-6/10 blur-3xl opacity-30" />
              <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="h4">Votre utilisation</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-lg text-xs font-code bg-n-7 hover:bg-n-6 text-n-2 transition-colors">
                      7j
                    </button>
                    <button className="px-3 py-1 rounded-lg text-xs font-code bg-color-1/20 text-color-1 border border-color-1/50">
                      30j
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-n-3 text-sm font-code">Fichiers uploadés</div>
                      <div className="text-n-1 font-code">{stats.totalUploads} / Illimité</div>
                    </div>
                    <div className="w-full bg-n-7 rounded-full h-2">
                      <div className="bg-gradient-to-r from-color-1 to-color-5 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-n-3 text-sm font-code">Fichiers traités</div>
                      <div className="text-n-1 font-code">{stats.totalProcessed} / Illimité</div>
                    </div>
                    <div className="w-full bg-n-7 rounded-full h-2">
                      <div className="bg-gradient-to-r from-color-5 to-color-6 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-n-3 text-sm font-code">Analyses IA</div>
                      <div className="text-n-1 font-code">{stats.totalAnalyzed} / Illimité</div>
                    </div>
                    <div className="w-full bg-n-7 rounded-full h-2">
                      <div className="bg-gradient-to-r from-color-6 to-color-1 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-color-1/10 via-color-5/10 to-color-6/10 blur-3xl opacity-30" />
              <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-8">
                <h3 className="h4 mb-6">Facturation</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-n-6">
                    <div>
                      <div className="text-n-1 font-code mb-1">Plan actuel</div>
                      <div className="text-n-3 text-sm">{getPlanName(user.plan)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-n-1 font-code">
                        {user.plan === 'free' ? 'Gratuit' : user.plan === 'studio' ? 'Sur mesure' : '9.99€/mois'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-n-6">
                    <div>
                      <div className="text-n-1 font-code mb-1">Prochaine facturation</div>
                      <div className="text-n-3 text-sm">-</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={() => navigate('/#pricing')}>
                      Gérer l'abonnement
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <Section className="pt-32 pb-16 min-h-screen">
        <div className="container">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar gauche */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-color-1/10 to-color-5/10 blur-3xl opacity-30" />
                  <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-6 sticky top-24">
                    {/* En-tête utilisateur */}
                    <div className="mb-6 pb-6 border-b border-n-6">
                      <div className="flex items-center gap-3 mb-3">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full object-cover border-2 border-n-6"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-color-1 to-color-5 flex items-center justify-center text-lg font-bold text-n-1">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-n-1 font-code text-sm truncate">
                            {user.full_name || "Utilisateur"}
                          </div>
                          <div className="text-n-3 text-xs font-code truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-code ${getPlanBadgeColor(user.plan)}`}>
                          {getPlanName(user.plan)}
                        </span>
                      </div>
                    </div>

                    {/* Menu de navigation */}
                    <nav className="space-y-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-code text-sm transition-colors ${
                            activeSection === item.id
                              ? "bg-color-1/20 text-color-1 border border-color-1/50"
                              : "text-n-2 hover:text-n-1 hover:bg-n-7/50"
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </nav>

                    {/* Bouton déconnexion */}
                    <div className="mt-6 pt-6 border-t border-n-6">
                      <Button
                        className="w-full bg-n-6 hover:bg-n-7"
                        onClick={logout}
                      >
                        Déconnexion
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu principal à droite */}
              <div className="flex-1 min-w-0">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </Section>
      <Footer />
    </>
  );
};

export default Profile;
