import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PlusCircle } from 'lucide-react';

const ExpenseForm = () => {
    const { addExpense } = useFinance();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Housing');

    const categories = ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Other'];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amount) return;
        
        addExpense({
            name,
            amount: parseFloat(amount),
            category
        });

        setName('');
        setAmount('');
        // keep category same for fast logging
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-fintech-darkCard p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Add New Expense</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expense Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Groceries"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 bg-transparent focus:ring-2 focus:ring-fintech-secondary focus:border-transparent outline-none dark:text-white transition-all"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 bg-transparent focus:ring-2 focus:ring-fintech-secondary focus:border-transparent outline-none dark:text-white transition-all"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 bg-white dark:bg-fintech-darkCard focus:ring-2 focus:ring-fintech-secondary focus:border-transparent outline-none dark:text-white transition-all"
                    >
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-1 flex items-end">
                    <button
                        type="submit"
                        className="w-full bg-fintech-primary dark:bg-fintech-secondary hover:bg-slate-800 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <PlusCircle size={18} />
                        Add Expense
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ExpenseForm;
