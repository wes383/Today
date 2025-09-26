import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center gap-3 py-8">
      <h1 className="text-4xl font-bold text-slate-800">Today</h1>
    </header>
  );
};

export default Header;