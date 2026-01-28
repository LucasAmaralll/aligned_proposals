import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  KeyIcon, 
  TrashIcon,
  PhotoIcon 
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || '',
    website: user?.website || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');
  const [logoPreview, setLogoPreview] = useState(
    user?.logo ? `${baseUrl}${user.logo}` : null
  );

  // Atualizar preview quando user.logo mudar
  useEffect(() => {
    if (user?.logo) {
      setLogoPreview(`${baseUrl}${user.logo}`);
    }
  }, [user?.logo, baseUrl]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor, selecione apenas arquivos de imagem (JPEG, PNG, GIF, WebP)');
        e.target.value = '';
        return;
      }

      // Validar tamanho (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB');
        e.target.value = '';
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await api.patch('/users/profile', formData);
      alert('Informações atualizadas com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      alert(error.response?.data?.error || 'Erro ao atualizar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLogo = async (e) => {
    e.preventDefault();
    
    if (!logoFile) {
      alert('Selecione uma imagem');
      return;
    }

    try {
      setLoading(true);
      const formDataObj = new FormData();
      formDataObj.append('logo', logoFile);
      
      const response = await api.patch('/users/logo', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('✅ Logo atualizado:', response.data);
      alert('Logo atualizado com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('❌ Erro ao atualizar logo:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || 'Erro ao atualizar logo';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!user?.logo) {
      alert('Nenhuma logo para deletar');
      return;
    }

    if (!window.confirm('Tem certeza que deseja deletar a logo?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/users/logo');
      alert('Logo deletada com sucesso!');
      setLogoPreview(null);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar logo:', error);
      alert(error.response?.data?.error || 'Erro ao deletar logo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await api.patch('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      alert('Senha atualizada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      alert(error.response?.data?.error || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await api.delete('/users/account');
      alert('Conta excluída com sucesso');
      logout();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      alert(error.response?.data?.error || 'Erro ao excluir conta');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const tabs = [
    { id: 'info', name: 'Informações', icon: UserIcon },
    { id: 'company', name: 'Empresa', icon: BuildingOfficeIcon },
    { id: 'logo', name: 'Logo', icon: PhotoIcon },
    { id: 'security', name: 'Segurança', icon: KeyIcon },
    { id: 'danger', name: 'Zona de Perigo', icon: TrashIcon }
  ];

  return (
    <Layout title="Meu Perfil">
      <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Meu Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas informações pessoais e configurações de conta
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex gap-6 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                        ${isActive
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Informações Pessoais */}
              {activeTab === 'info' && (
                <form onSubmit={handleUpdateInfo} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Informações Pessoais
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Nome Completo *"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        label="Email *"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        label="Telefone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                      />
                      <Input
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://www.seusite.com"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Informações da Empresa */}
              {activeTab === 'company' && (
                <form onSubmit={handleUpdateInfo} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Informações da Empresa
                    </h3>
                    <Input
                      label="Nome da Empresa"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Digite o nome da sua empresa"
                    />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Esta informação aparecerá nos seus orçamentos
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Logo */}
              {activeTab === 'logo' && (
                <form onSubmit={handleUpdateLogo} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Logo da Empresa
                    </h3>
                    
                    <div className="flex flex-col items-center gap-6">
                      {/* Preview */}
                      <div className="relative w-32 h-32">
                        <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                          {logoPreview ? (
                            <img 
                              src={logoPreview} 
                              alt="Logo preview" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={handleDeleteLogo}
                            disabled={loading}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
                            title="Deletar logo"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* File Input */}
                      <div className="w-full">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleLogoChange}
                          className="block w-full text-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                        />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          JPEG, PNG, GIF ou WebP (máx. 2MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading || !logoFile}>
                      {loading ? 'Enviando...' : 'Atualizar Logo'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Segurança */}
              {activeTab === 'security' && (
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Alterar Senha
                    </h3>
                    <div className="space-y-4">
                      <Input
                        label="Senha Atual *"
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <Input
                        label="Nova Senha *"
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <Input
                        label="Confirmar Nova Senha *"
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Zona de Perigo */}
              {activeTab === 'danger' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                      Excluir Conta
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Esta ação é permanente e não pode ser desfeita. Todos os seus dados, 
                      incluindo clientes e orçamentos, serão removidos.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                    >
                      <TrashIcon className="h-5 w-5 mr-2" />
                      Excluir Minha Conta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão de Conta"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Tem certeza que deseja excluir sua conta? Esta ação é <strong>irreversível</strong> e todos os seus dados serão permanentemente removidos.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Excluindo...' : 'Sim, Excluir Conta'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Profile;
