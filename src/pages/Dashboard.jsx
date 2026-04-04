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
        <div className="flex h-screen overflow-hidden bg-fintech-bg dark:bg-fintech-darkBg">
            {/* Mobile Sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar with mobile toggle logic wrapping it */}
            <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-30 transform translate-x-0 transition duration-200' : 'fixed inset-y-0 left-0 z-30 transform -translate-x-full transition duration-200'} md:relative md:translate-x-0`}>
                <Sidebar />
            </div>

            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className="p-6 md:p-8 mt-16 md:mt-0 max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-fintech-primary dark:text-white">Dashboard</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back. Here's your financial overview.</p>
                        </div>
                    </div>

                    {/* Monthly Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Expense Breakdown */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-fintech-darkCard p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2"
                        >
                            <h3 className="text-xl font-bold mb-6 dark:text-white">Expense Breakdown</h3>
                            <ExpenseChart expenses={expenses} />
                        </motion.div>

                        {/* Savings Progress */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-fintech-darkCard p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col"
                        >
                            <h3 className="text-xl font-bold mb-6 dark:text-white">Savings Goal</h3>
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-center mb-6">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Current Progress</p>
                                    <h4 className="text-4xl font-extrabold text-fintech-primary dark:text-white">
                                        {savingsPercent.toFixed(1)}%
                                    </h4>
                                    <p className="text-sm text-green-500 font-medium mt-2">Target: 20% of Budget</p>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 mb-4 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressWidth}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="bg-fintech-accent h-4 rounded-full"
                                    ></motion.div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
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
