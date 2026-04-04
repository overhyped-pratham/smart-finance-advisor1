import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ExpenseInputPage from './pages/ExpenseInputPage';
import FinancialAnalysisPage from './pages/FinancialAnalysisPage';
import AIInsightsPage from './pages/AIInsightsPage';

function App() {
  return (
    <FinanceProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpenseInputPage />} />
          <Route path="/analysis" element={<FinancialAnalysisPage />} />
          <Route path="/ai-insights" element={<AIInsightsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </FinanceProvider>
  );
}

export default App;
