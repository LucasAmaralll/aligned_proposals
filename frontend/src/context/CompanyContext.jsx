import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CompanyContext = createContext({});

const UNIT_STORAGE_KEY = 'currentUnitId';

export const CompanyProvider = ({ children }) => {
  const { user, signed } = useAuth();
  const [currentUnitId, setCurrentUnitIdState] = useState(() =>
    localStorage.getItem(UNIT_STORAGE_KEY)
  );

  const units = useMemo(() => user?.units || [], [user]);
  const company = user?.company || null;
  const role = user?.role || null;

  const currentUnit = useMemo(() => {
    if (!units.length) return null;
    return units.find((unit) => unit.id === currentUnitId) || units[0];
  }, [units, currentUnitId]);

  useEffect(() => {
    if (!signed) {
      localStorage.removeItem(UNIT_STORAGE_KEY);
      delete api.defaults.headers['X-Unit-Id'];
      setCurrentUnitIdState(null);
      return;
    }

    if (currentUnit?.id) {
      localStorage.setItem(UNIT_STORAGE_KEY, currentUnit.id);
      api.defaults.headers['X-Unit-Id'] = currentUnit.id;
      if (currentUnit.id !== currentUnitId) {
        setCurrentUnitIdState(currentUnit.id);
      }
    }
  }, [signed, currentUnit, currentUnitId]);

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
