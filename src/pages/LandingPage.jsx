import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, PieChart, Shield } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-cf-bg">
            {/* Nav */}
            <nav className="p-6 flex justify-between items-center max-w-7xl w-full mx-auto">
                <div className="font-display text-2xl font-bold text-cf-primary tracking-tight-display">Smart Finance</div>
                <div className="flex gap-4 items-center">
                    <Link to="/expenses" className="btn-ghost text-sm">
                        Features
                    </Link>
                    <Link to="/dashboard" className="btn-primary text-sm">
                        Dashboard
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-12 pb-24 relative z-10">
                {/* Ambient orbs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cf-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cf-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl relative z-10"
                >
                    <h1 className="text-display-lg md:text-[5rem] md:leading-[1.05] text-cf-on-surface tracking-tight-display mb-6 leading-tight">
                        Smart Financial <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-cf-gradient">Planning Made Simple</span>
                    </h1>
                    <p className="text-lg text-cf-on-muted mb-10 max-w-2xl mx-auto leading-relaxed">
                        Track expenses, calculate savings, and get AI-powered investment recommendations tailored for your financial future.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/expenses" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                            Start Tracking <ArrowRight size={20} />
                        </Link>
                        <Link to="/dashboard" className="btn-ghost text-lg px-8 py-4 w-full sm:w-auto justify-center flex">
                            Open Dashboard
                        </Link>
                    </div>
                </motion.div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full relative z-10">
                    <FeatureCard
                        icon={<PieChart size={28} className="text-cf-primary" />}
                        title="Expense Tracking"
                        desc="Easily categorize and monitor your daily spending patterns."
                    />
                    <FeatureCard
                        icon={<BarChart3 size={28} className="text-cf-tertiary" />}
                        title="Budget Analysis"
                        desc="Real-time calculation of your net savings based on intuitive logic."
                    />
                    <FeatureCard
                        icon={<Shield size={28} className="text-cf-secondary" />}
                        title="Investment Recommendations"
                        desc="Get curated, moderate-risk assets to grow your wealth safely."
                    />
                </div>
            </main>

            {/* CTA Footer */}
            <footer className="py-16 bg-cf-surface-low text-center">
                <h2 className="font-display text-display-md text-cf-on-surface mb-6">Take Control of Your Finances Today</h2>
                <Link to="/expenses" className="btn-primary text-lg px-8 py-3 inline-block">
                    Get Started Free
                </Link>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <motion.div 
        whileHover={{ y: -4 }}
        className="group bg-cf-surface-high p-8 rounded text-left transition-all duration-500 hover:shadow-glow-primary relative overflow-hidden"
    >
        {/* Subtle hover glow orb */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cf-primary/5 rounded-full blur-[40px] group-hover:bg-cf-primary/15 transition-all duration-500"></div>
        
        <div className="bg-cf-surface-low w-14 h-14 rounded flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="font-display text-lg font-bold text-cf-on-surface mb-3 group-hover:text-cf-primary transition-colors duration-300">{title}</h3>
        <p className="text-cf-on-muted text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

export default LandingPage;
