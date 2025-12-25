import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Section from '../components/Section';
import Heading from '../components/Heading';
import Button from '../components/Button';
import ButtonSvg from '../assets/svg/ButtonSvg';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/studio');
    } else {
      setError(result.error || 'Erreur de connexion');
    }
    
    setLoading(false);
  };

  return (
    <>
      <Header />
      <Section className="pt-32 pb-16">
        <div className="container">
          <div className="max-w-md mx-auto">
            <Heading
              tag="Connexion"
              title="Accédez à votre compte"
              className="text-center mb-8"
            />
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-color-1/20 via-color-5/20 to-color-6/20 blur-3xl opacity-50" />
              <div className="relative bg-n-8/50 backdrop-blur-sm border border-n-6 rounded-3xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-n-7/50 border border-color-3/50 rounded-lg p-4">
                      <p className="text-color-3 text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-code text-n-2 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 placeholder-n-4 focus:outline-none focus:border-color-1 transition-colors"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-code text-n-2 mb-2">
                      Mot de passe
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-lg text-n-1 placeholder-n-4 focus:outline-none focus:border-color-1 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full justify-center"
                    disabled={loading}
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-n-3 text-sm">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="text-color-1 hover:text-color-2 transition-colors">
                      Créer un compte
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
      <Footer />
    </>
  );
};

export default Login;


