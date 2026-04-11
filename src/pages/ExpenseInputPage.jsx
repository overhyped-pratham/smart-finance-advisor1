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
        <div className="flex h-screen overflow-hidden bg-cf-bg">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
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
                            <h1 className="text-display-md text-cf-on-surface">Track Expenses</h1>
                            <p className="text-cf-on-muted mt-1 text-sm">Input your budget and add your monthly expenses.</p>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            className="bg-cf-gradient-secondary text-white font-bold py-2 px-6 rounded flex items-center gap-2 transition-all shadow-glow-secondary hover:shadow-[0_0_24px_rgba(214,116,255,0.35)] text-sm"
                        >
                            <Calculator size={18} />
                            <span className="hidden sm:inline">Analyze Finances</span>
                        </button>
                    </div>

                    {/* Monthly Budget Input */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-cf-surface-high p-6 rounded mb-8"
                    >
                        <h3 className="font-display text-lg font-bold mb-4 text-cf-on-surface">Monthly Budget</h3>
                        <div className="flex items-center gap-4 max-w-sm">
                            <div className="relative w-full">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cf-on-muted font-bold text-sm">$</span>
                                <input
                                    type="number"
                                    value={budget || ''}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    placeholder="Enter monthly budget"
                                    className="input-bottomline pl-6"
                                    style={{ fontVariantNumeric: 'tabular-nums' }}
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
                        className="bg-cf-surface-high rounded overflow-hidden"
                    >
                        <div className="p-6">
                            <h3 className="font-display text-lg font-bold text-cf-on-surface">Expense List</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-cf-surface-low text-cf-on-muted text-label-sm">
                                        <th className="p-4">Expense Name</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-cf-on-muted text-sm">
                                                No expenses added yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense, i) => (
                                            <tr 
                                                key={expense.id} 
                                                className={`hover:bg-cf-surface-high/50 transition-colors ${
                                                    i % 2 === 0 ? 'bg-cf-surface-low' : 'bg-cf-surface-lowest'
                                                }`}
                                            >
                                                <td className="p-4 text-cf-on-surface font-medium text-sm">
                                                    {expense.name}
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-cf-surface-high text-cf-on-muted px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-cf-on-surface text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    ${Number(expense.amount).toFixed(2)}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => deleteExpense(expense.id)}
                                                        className="text-cf-on-muted hover:text-cf-error transition-colors p-2 rounded hover:bg-cf-error/10"
                                                    >
                                                        <Trash2 size={16} />
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
