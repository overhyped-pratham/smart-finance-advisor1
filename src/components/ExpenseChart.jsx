import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ExpenseChart = ({ expenses }) => {
    // Group expenses by category
    const categoryData = expenses.reduce((acc, expense) => {
        const existing = acc.find(c => c.name === expense.category);
        if (existing) {
            existing.value += Number(expense.amount);
        } else {
            acc.push({ name: expense.category, value: Number(expense.amount) });
        }
        return acc;
    }, []);

    const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

    if (!expenses || expenses.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500">
                No expense data available.
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-fintech-darkCard p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{payload[0].name}</p>
                    <p className="text-fintech-secondary font-bold">
                        ${payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpenseChart;
