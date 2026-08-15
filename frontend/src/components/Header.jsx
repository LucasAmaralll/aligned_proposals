import React from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { getCompanyName } from '../utils/helpers';

const Header = ({ title }) => {
  const { user } = useAuth();
  const { company, units, currentUnit, setCurrentUnitId, role } = useCompany();
  const companyName = getCompanyName(company) || getCompanyName(user);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
          {companyName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {companyName}
              {role?.name ? ` · ${role.name}` : ''}
            </p>
          )}
        </div>

        {units.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="hidden sm:inline">Unidade</span>
            <select
              value={currentUnit?.id || ''}
              onChange={(event) => setCurrentUnitId(event.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-[140px]"
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                  {unit.type === 'factory' ? ' (Fábrica)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  );
};

export default Header;
