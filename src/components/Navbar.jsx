import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrokerConnect from './BrokerConnect';

const Navbar = ({ toggleSidebar }) => {
    return (
        <header className="h-14 flex items-center justify-between px-6 bg-cf-surface-low absolute top-0 w-full z-10 md:static">
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar}
                    className="md:hidden p-2 rounded text-cf-on-muted hover:bg-cf-surface-high/40 hover:text-cf-primary transition-colors"
                >
                    <Menu size={22} />
                </button>
                <Link to="/" className="md:hidden font-display text-lg font-bold text-cf-primary tracking-tight-display">
                    Smart Finance
                </Link>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <BrokerConnect />
                <div className="h-8 w-8 rounded bg-cf-surface-high text-cf-primary flex items-center justify-center font-bold text-sm font-display">
                    U
                </div>
            </div>
        </header>
    );
};

export default Navbar;
