import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar deve ser usado dentro de SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Para mobile

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapse,
        isOpen,
        setIsOpen,
        toggleMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
