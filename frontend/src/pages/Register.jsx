import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { EnvelopeIcon, LockClosedIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signUp(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-2xl">AP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Criar Conta</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Comece a criar orçamentos hoje</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome completo"
              type="text"
              name="name"
              icon={UserIcon}
              value={formData.name}
              onChange={handleChange}
              placeholder="João da Silva"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              icon={EnvelopeIcon}
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
            />

            <Input
              label="Empresa (opcional)"
              type="text"
              name="company"
              icon={BuildingOfficeIcon}
              value={formData.company}
              onChange={handleChange}
              placeholder="Minha Empresa Ltda"
            />

            <Input
              label="Senha"
              type="password"
              name="password"
              icon={LockClosedIcon}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
