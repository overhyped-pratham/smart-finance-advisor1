import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

export const useFinance = () => {
    return useContext(FinanceContext);
};

export const FinanceProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [budget, setBudget] = useState(0);
    const [expenses, setExpenses] = useState([]);

    // Fetch initial data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch budget
                const budgetRes = await fetch('http://localhost:5000/api/budget');
                if (budgetRes.ok) {
                    const budgetData = await budgetRes.json();
                    setBudget(budgetData.amount);
                }

                // Fetch expenses
                const expensesRes = await fetch('http://localhost:5000/api/expenses');
                if (expensesRes.ok) {
                    const expensesData = await expensesRes.json();
                    setExpenses(expensesData);
                }
            } catch (err) {
                console.error("Error connecting to backend API:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Expose a setter for budget that updates the DB
    const updateBudget = async (newAmount) => {
        setBudget(newAmount);
        try {
            await fetch('http://localhost:5000/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: newAmount })
            });
        } catch (err) {
            console.error(err);
        }
    };

    // No local storage sync for expenses needed because we use DB
    // Remove the expenses useEffect

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const addExpense = async (expense) => {
        const id = Date.now().toString();
        const newExpense = { ...expense, id };
        setExpenses([...expenses, newExpense]); // Optimistic update
        
        try {
            await fetch('http://localhost:5000/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            });
        } catch (err) {
            console.error(err);
        }
    };

    const deleteExpense = async (id) => {
        setExpenses(expenses.filter(e => e.id !== id)); // Optimistic update
        
        try {
            await fetch(`http://localhost:5000/api/expenses/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.error(err);
        }
    };

    const totalExpenses = expenses.reduce((sum, curr) => sum + Number(curr.amount), 0);
    const netSavings = budget - totalExpenses;

    const value = {
        theme,
        toggleTheme,
        budget,
        setBudget: updateBudget,
        expenses,
        addExpense,
        deleteExpense,
        totalExpenses,
        netSavings
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};
