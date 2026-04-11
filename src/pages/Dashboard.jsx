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
        <div className="flex h-screen overflow-hidden bg-cf-bg relative">
            {/* Ambient Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cf-secondary/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-cf-primary/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Mobile Sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar with mobile toggle */}
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
                            <h1 className="text-display-md text-cf-on-surface">Dashboard</h1>
                            <p className="text-cf-on-muted mt-2 text-sm">Welcome back. Here's your financial overview.</p>
                        </div>
                    </motion.div>

                    {/* Budget Cards */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                    >
                        <BudgetCard 
                            title="Monthly Budget" 
                            amount={budget} 
                            icon={<Wallet size={22} />} 
                        />
                        <BudgetCard 
                            title="Total Expenses" 
                            amount={totalExpenses} 
                            icon={<CreditCard size={22} />} 
                        />
                        <BudgetCard 
                            title="Net Savings" 
                            amount={netSavings} 
                            icon={<PiggyBank size={22} />} 
                            isAccent={true}
                        />
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Expense Breakdown — spans 7 columns feel (col-span-2) for asymmetry */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-cf-surface-high p-8 rounded lg:col-span-2 relative overflow-hidden group hover:shadow-glow-secondary transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cf-secondary/5 rounded-full blur-[50px] group-hover:bg-cf-secondary/10 transition-colors duration-500"></div>
                            <h3 className="font-display text-xl font-bold mb-6 text-cf-on-surface">Expense Breakdown</h3>
                            <div className="relative z-10 w-full h-80 flex items-center justify-center">
                                <ExpenseChart expenses={expenses} />
                            </div>
                        </motion.div>

                        {/* Savings Progress — spans 5 columns feel (col-span-1) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-cf-surface-high p-8 rounded flex flex-col relative overflow-hidden group hover:shadow-glow-primary transition-all duration-500"
                        >
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cf-primary/10 rounded-full blur-[50px] group-hover:bg-cf-primary/20 transition-colors duration-500"></div>
                            <h3 className="font-display text-xl font-bold mb-6 text-cf-on-surface relative z-10">Savings Goal</h3>
                            <div className="flex-1 flex flex-col justify-center relative z-10">
                                <div className="text-center mb-6">
                                    <p className="text-label-sm text-cf-on-muted mb-2">Current Progress</p>
                                    <h4 className="text-display-md text-cf-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {savingsPercent.toFixed(1)}%
                                    </h4>
                                    <p className="text-xs text-cf-tertiary font-medium mt-3 bg-cf-tertiary/10 px-3 py-1 rounded inline-block">Target: 20% of Budget</p>
                                </div>
                                <div className="w-full bg-cf-surface-lowest rounded h-3 mb-4 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressWidth}%` }}
                                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                        className="bg-cf-gradient h-3 rounded relative shadow-glow-primary"
                                    >
                                    </motion.div>
                                </div>
                                <p className="text-sm text-cf-on-muted text-center mt-2 group-hover:text-cf-on-surface transition-colors">
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
