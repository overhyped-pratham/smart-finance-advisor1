import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Sun, Moon, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrokerConnect from './BrokerConnect';

const Navbar = ({ toggleSidebar }) => {
    const { theme, toggleTheme } = useFinance();

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-fintech-darkCard border-b border-slate-200 dark:border-slate-800 absolute top-0 w-full z-10 md:static">
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar}
                    className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <Menu size={24} />
                </button>
                <Link to="/" className="md:hidden text-xl font-bold text-fintech-primary dark:text-white">
                    Smart Finance
                </Link>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <BrokerConnect />
                <div className="h-8 w-8 rounded-full bg-fintech-accent text-white flex items-center justify-center font-bold">
                    U
                </div>
            </div>
        </header>
    );
};

export default Navbar;
