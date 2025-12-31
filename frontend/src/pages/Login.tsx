import React, { useState } from 'react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici tu peux gérer la connexion (API ou authentification)
    alert(`Email: ${email}\nMot de passe: ${password}\nSe souvenir: ${remember}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 px-4">
      <div className="login-card bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="login-logo text-5xl mb-4 text-center">📋</div>
        <h1 className="login-title text-3xl font-bold text-gray-800 text-center">Taskme</h1>
        <p className="login-subtitle text-gray-600 text-center mb-6">Gestion intelligente des tâches</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group flex flex-col">
            <label className="text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              className="form-control px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group flex flex-col">
            <label className="text-gray-700 font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              className="form-control px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-between items-center mb-6 text-sm text-gray-600">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Se souvenir
            </label>
            <a href="#" className="text-blue-600 hover:underline">Mot de passe oublié?</a>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
