import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { hasPermission, isAdmin, isSeller } from '../utils/permissions';

const CompanyContext = createContext({});

const UNIT_STORAGE_KEY = 'currentUnitId';

export const CompanyProvider = ({ children }) => {
  const { user, signed, refreshUser } = useAuth();
  const [currentUnitId, setCurrentUnitIdState] = useState(() =>
    localStorage.getItem(UNIT_STORAGE_KEY)
  );
  const [company, setCompany] = useState(user?.company || null);
  const [units, setUnits] = useState(user?.units || []);

  const role = user?.role || null;

  const currentUnit = useMemo(() => {
    if (!units.length) return null;
    return units.find((unit) => unit.id === currentUnitId) || units[0];
  }, [units, currentUnitId]);

  const refreshCompany = async () => {
    if (!signed) return null;
    const response = await api.get('/companies/me');
    setCompany(response.data);
    setUnits(response.data.units || []);
    try {
      await refreshUser();
    } catch (error) {
      // sessão ainda vale; unidades já vieram da empresa
    }
    return response.data;
  };

  useEffect(() => {
    if (!signed) {
      localStorage.removeItem(UNIT_STORAGE_KEY);
      delete api.defaults.headers['X-Unit-Id'];
      setCurrentUnitIdState(null);
      setCompany(null);
      setUnits([]);
      return;
    }

    refreshCompany().catch(() => {
      setCompany(user?.company || null);
      setUnits(user?.units || []);
    });
  }, [signed, user?.id]);

  useEffect(() => {
    if (currentUnit?.id) {
      localStorage.setItem(UNIT_STORAGE_KEY, currentUnit.id);
      api.defaults.headers['X-Unit-Id'] = currentUnit.id;
      if (currentUnit.id !== currentUnitId) {
        setCurrentUnitIdState(currentUnit.id);
      }
    }
  }, [currentUnit, currentUnitId]);

  const setCurrentUnitId = (unitId) => {
    const exists = units.some((unit) => unit.id === unitId);
    if (!exists) return;
    localStorage.setItem(UNIT_STORAGE_KEY, unitId);
    api.defaults.headers['X-Unit-Id'] = unitId;
    setCurrentUnitIdState(unitId);
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        role,
        units,
        currentUnit,
        setCurrentUnitId,
        refreshCompany,
        isAdmin: isAdmin(role),
        isSeller: isSeller(role),
        can: (permission) => hasPermission(role, permission),
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export default CompanyContext;
