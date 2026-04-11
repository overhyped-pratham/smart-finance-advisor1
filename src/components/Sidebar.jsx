import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, TrendingUp, Settings, Brain } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Expenses', path: '/expenses', icon: <Wallet size={20} /> },
        { name: 'Budget', path: '/dashboard', icon: <PieChart size={20} /> }, // routing back to dashboard for now
        { name: 'Investments', path: '/analysis', icon: <TrendingUp size={20} /> },
        { name: 'AI Insights', path: '/ai-insights', icon: <Brain size={20} /> },
        { name: 'Settings', path: '/dashboard', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="w-64 bg-cf-surface-low h-screen hidden md:block pt-5 sticky top-0">
            <div className="px-6 mb-8 mt-14">
                <h2 className="font-display text-xl font-bold text-cf-primary tracking-tight-display">
                    Smart Finance
                </h2>
            </div>
            <nav className="flex flex-col gap-1 px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${
                                isActive
                                    ? 'bg-cf-surface-high text-cf-primary shadow-glow-primary'
                                    : 'text-cf-on-muted hover:bg-cf-surface-high/40 hover:text-cf-on-surface'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="font-medium text-sm">{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
