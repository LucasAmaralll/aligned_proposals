import React from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { getCompanyName } from '../utils/helpers';
import { getRoleLabel } from '../utils/permissions';

const Header = ({ title }) => {
  const { user } = useAuth();
  const { company, units, currentUnit, setCurrentUnitId, role } = useCompany();
  const companyName = getCompanyName(company) || getCompanyName(user);
  const initials = (user?.name || 'A')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-gray-200/80 dark:border-zinc-800 px-4 sm:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 pl-12 lg:pl-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {companyName && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
              {companyName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {units.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-300">
              <span className="hidden sm:inline text-xs uppercase tracking-wider text-gray-400">Unidade</span>
              <select
                value={currentUnit?.id || ''}
                onChange={(event) => setCurrentUnitId(event.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm min-w-[140px]"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                    {unit.type === 'factory' ? ' · Fábrica' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="hidden sm:flex items-center gap-2 pl-2">
            <div className="h-9 w-9 rounded-full bg-gray-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium text-gray-900 dark:text-white max-w-[140px] truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">{getRoleLabel(role)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
