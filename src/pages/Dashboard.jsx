import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BudgetCard from '../components/BudgetCard';
import ExpenseChart from '../components/ExpenseChart';
import { Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { budget, totalExpenses, netSavings, expenses } = useFinance();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const savingsGoal = budget > 0 ? (budget * 0.2) : 0; // Example goal: 20% of budget
    const savingsPercent = budget > 0 ? ((netSavings / budget) * 100) : 0;
    const progressWidth = Math.min(Math.max(savingsPercent, 0), 100);

    return (
        <div className="flex h-screen overflow-hidden bg-fintech-bg dark:bg-fintech-darkBg relative">
            {/* Ambient Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-fintech-secondary/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-fintech-accent/10 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]"></div>
            </div>

            {/* Mobile Sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar with mobile toggle logic wrapping it */}
            <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-30 transform translate-x-0 transition duration-300 ease-in-out' : 'fixed inset-y-0 left-0 z-30 transform -translate-x-full transition duration-300 ease-in-out'} md:relative md:translate-x-0`}>
                <Sidebar />
            </div>

            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative z-10">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className="p-6 md:p-8 mt-16 md:mt-0 max-w-7xl mx-auto w-full">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-between items-center mb-8"
                    >
                        <div>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Dashboard</h1>
                            <p className="text-slate-400 mt-2 font-medium">Welcome back. Here's your financial overview.</p>
                        </div>
                    </motion.div>

                    {/* Monthly Overview Cards - Adding Glassmorphism classes to the BudgetCard via props or wrapper? BudgetCard is its own component. Let's just wrap it or let it handle its own style. Assuming we want it to be translucent, we might need to edit BudgetCard.jsx too. */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                    >
                        <BudgetCard 
                            title="Monthly Budget" 
                            amount={budget} 
                            icon={<Wallet size={24} />} 
                        />
                        <BudgetCard 
                            title="Total Expenses" 
                            amount={totalExpenses} 
                            icon={<CreditCard size={24} />} 
                        />
                        <BudgetCard 
                            title="Net Savings" 
                            amount={netSavings} 
                            icon={<PiggyBank size={24} />} 
                            isAccent={true}
                        />
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Expense Breakdown */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 dark:bg-fintech-darkCard/40 backdrop-blur-2xl p-8 rounded-3xl shadow-glass border border-white/10 dark:border-white/5 lg:col-span-2 relative overflow-hidden group hover:border-white/20 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-fintech-secondary/5 rounded-full blur-[50px] group-hover:bg-fintech-secondary/10 transition-colors duration-500"></div>
                            <h3 className="text-2xl font-bold mb-6 dark:text-white">Expense Breakdown</h3>
                            <div className="relative z-10 w-full h-80 flex items-center justify-center">
                                <ExpenseChart expenses={expenses} />
                            </div>
                        </motion.div>

                        {/* Savings Progress */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/5 dark:bg-fintech-darkCard/40 backdrop-blur-2xl p-8 rounded-3xl shadow-glass border border-white/10 dark:border-white/5 flex flex-col relative overflow-hidden group hover:border-white/20 transition-all duration-500"
                        >
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-fintech-accent/10 rounded-full blur-[50px] group-hover:bg-fintech-accent/20 transition-colors duration-500"></div>
                            <h3 className="text-2xl font-bold mb-6 dark:text-white relative z-10">Savings Goal</h3>
                            <div className="flex-1 flex flex-col justify-center relative z-10">
                                <div className="text-center mb-6">
                                    <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest font-semibold">Current Progress</p>
                                    <h4 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-fintech-accent to-blue-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                                        {savingsPercent.toFixed(1)}%
                                    </h4>
                                    <p className="text-sm text-green-400 font-medium mt-3 bg-green-400/10 px-3 py-1 rounded-full inline-block">Target: 20% of Budget</p>
                                </div>
                                <div className="w-full bg-slate-800/50 rounded-full h-4 mb-4 overflow-hidden shadow-inner border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressWidth}%` }}
                                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                        className="bg-gradient-to-r from-fintech-accent to-blue-500 h-4 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)] relative"
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-50"></div>
                                    </motion.div>
                                </div>
                                <p className="text-sm text-slate-400 text-center mt-2 group-hover:text-slate-300 transition-colors">
                                    {netSavings >= savingsGoal 
                                        ? "Great job! You've reached your savings goal." 
                                        : `You need $${(savingsGoal - netSavings).toFixed(2)} more to reach your goal.`}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
