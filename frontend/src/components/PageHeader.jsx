import React from 'react';

const PageHeader = ({ title, description, actions }) => (
  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);

export default PageHeader;
