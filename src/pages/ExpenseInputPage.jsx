import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ExpenseForm from '../components/ExpenseForm';
import { Trash2, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

const ExpenseInputPage = () => {
    const { budget, setBudget, expenses, deleteExpense } = useFinance();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleAnalyze = () => {
        navigate('/analysis');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-fintech-bg dark:bg-fintech-darkBg">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-30 transform translate-x-0 transition duration-200' : 'fixed inset-y-0 left-0 z-30 transform -translate-x-full transition duration-200'} md:relative md:translate-x-0`}>
                <Sidebar />
            </div>

            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className="p-6 md:p-8 mt-16 md:mt-0 max-w-5xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-fintech-primary dark:text-white">Track Expenses</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Input your budget and add your monthly expenses.</p>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            className="bg-fintech-secondary hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Calculator size={20} />
                            <span className="hidden sm:inline">Analyze Finances</span>
                        </button>
                    </div>

                    {/* Monthly Budget Input */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-fintech-darkCard p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8"
                    >
                        <h3 className="text-xl font-bold mb-4 dark:text-white">Monthly Budget</h3>
                        <div className="flex items-center gap-4 max-w-sm">
                            <div className="relative w-full">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">$</span>
                                <input
                                    type="number"
                                    value={budget || ''}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    placeholder="Enter monthly budget"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-fintech-bg dark:bg-slate-800 focus:ring-2 focus:ring-fintech-accent focus:border-transparent outline-none dark:text-white transition-all text-lg font-medium"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Expense Form */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <ExpenseForm />
                    </motion.div>

                    {/* Expense Table */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-fintech-darkCard rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold dark:text-white">Expense List</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                                        <th className="p-4 font-medium">Expense Name</th>
                                        <th className="p-4 font-medium">Category</th>
                                        <th className="p-4 font-medium">Amount</th>
                                        <th className="p-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">
                                                No expenses added yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense) => (
                                            <tr key={expense.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="p-4 text-fintech-primary dark:text-white font-medium">
                                                    {expense.name}
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-fintech-primary dark:text-white">
                                                    ${Number(expense.amount).toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => deleteExpense(expense.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default ExpenseInputPage;
