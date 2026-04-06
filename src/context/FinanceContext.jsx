import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

export const useFinance = () => {
    return useContext(FinanceContext);
};

// Helper to safely read from localStorage
const loadFromStorage = (key, fallback) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch {
        return fallback;
    }
};

// Helper to save to localStorage
const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.warn('Failed to save to localStorage:', err);
    }
};

export const FinanceProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [budget, setBudgetState] = useState(() => loadFromStorage('finance_budget', 0));
    const [expenses, setExpenses] = useState(() => loadFromStorage('finance_expenses', []));
    const [dataLoaded, setDataLoaded] = useState(false);

    // Try to fetch from backend API, but fall back to localStorage
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Try fetching budget from API
                const budgetRes = await fetch('/api/budget');
                if (budgetRes.ok) {
                    const budgetData = await budgetRes.json();
                    if (budgetData.amount && budgetData.amount > 0) {
                        setBudgetState(budgetData.amount);
                        saveToStorage('finance_budget', budgetData.amount);
                    }
                }
            } catch (err) {
                // API not available - use localStorage (already loaded via useState initializer)
                console.log('Budget API not available, using local storage.');
            }

            try {
                // Try fetching expenses from API
                const expensesRes = await fetch('/api/expenses');
                if (expensesRes.ok) {
                    const expensesData = await expensesRes.json();
                    if (Array.isArray(expensesData) && expensesData.length > 0) {
                        setExpenses(expensesData);
                        saveToStorage('finance_expenses', expensesData);
                    }
                }
            } catch (err) {
                console.log('Expenses API not available, using local storage.');
            }

            setDataLoaded(true);
        };
        fetchData();
    }, []);

    // Theme persistence
    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Persist budget to localStorage whenever it changes
    useEffect(() => {
        if (dataLoaded || budget > 0) {
            saveToStorage('finance_budget', budget);
        }
    }, [budget, dataLoaded]);

    // Persist expenses to localStorage whenever they change
    useEffect(() => {
        if (dataLoaded || expenses.length > 0) {
            saveToStorage('finance_expenses', expenses);
        }
    }, [expenses, dataLoaded]);

    // Update budget - saves locally + tries API
    const updateBudget = async (newAmount) => {
        setBudgetState(newAmount);
        saveToStorage('finance_budget', newAmount);
        try {
            await fetch('/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: newAmount })
            });
        } catch (err) {
            // API not available, already saved to localStorage
        }
    };

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const addExpense = async (expense) => {
        const id = Date.now().toString();
        const newExpense = { ...expense, id };
        const updatedExpenses = [...expenses, newExpense];
        setExpenses(updatedExpenses);
        saveToStorage('finance_expenses', updatedExpenses);
        
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            });
        } catch (err) {
            // API not available, already saved to localStorage
        }
    };

    const deleteExpense = async (id) => {
        const updatedExpenses = expenses.filter(e => e.id !== id);
        setExpenses(updatedExpenses);
        saveToStorage('finance_expenses', updatedExpenses);
        
        try {
            await fetch(`/api/expenses?id=${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            // API not available, already saved to localStorage
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
