import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import AuthShell from '../components/AuthShell';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Link inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell subtitle="Redefinir senha">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Este link está incompleto. Solicite um novo envio.
        </p>
        <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          Esqueci minha senha
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Escolha uma senha nova">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nova senha"
          type="password"
          icon={LockClosedIcon}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          icon={LockClosedIcon}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar senha'}
        </Button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
