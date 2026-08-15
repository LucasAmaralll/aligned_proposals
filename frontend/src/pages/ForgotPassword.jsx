import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import AuthShell from '../components/AuthShell';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      // resposta genérica de propósito
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <AuthShell subtitle="Recuperar senha">
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Se esse e-mail tiver uma conta, enviamos o link para redefinir a senha.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Não chegou? Confira o spam ou fale com a Aligned.
          </p>
          <Link
            to="/login"
            className="block text-center text-sm text-blue-600 dark:text-blue-400 font-medium"
          >
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            icon={EnvelopeIcon}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </Button>
          <Link
            to="/login"
            className="block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Voltar ao login
          </Link>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
