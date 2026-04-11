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
        <form onSubmit={handleSubmit} className="bg-cf-surface-high p-6 rounded">
            <h3 className="font-display text-lg font-bold mb-5 text-cf-on-surface">Add New Expense</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-1">
                    <label className="text-label-sm text-cf-on-muted mb-2 block">Expense Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Groceries"
                        className="input-bottomline"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="text-label-sm text-cf-on-muted mb-2 block">Amount ($)</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="input-bottomline"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="text-label-sm text-cf-on-muted mb-2 block">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="input-bottomline cursor-pointer"
                    >
                        {categories.map(c => (
                            <option key={c} value={c} className="bg-cf-surface-high text-cf-on-surface">{c}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-1 flex items-end">
                    <button
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                    >
                        <PlusCircle size={16} />
                        Add Expense
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ExpenseForm;
