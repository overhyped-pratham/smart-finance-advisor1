import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, X, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

const BROKERS = [
    {
        id: 'zerodha',
        name: 'Zerodha Kite',
        icon: 'https://kite.zerodha.com/static/images/kite-logo.svg',
        color: 'from-orange-500 to-red-500',
        borderColor: 'border-orange-500/30',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-400',
        fields: [
            { key: 'apiKey', label: 'API Key', placeholder: 'Your Zerodha API Key' },
            { key: 'apiSecret', label: 'API Secret', placeholder: 'Your Zerodha API Secret', type: 'password' }
        ]
    },
    {
        id: 'angelone',
        name: 'Angel One',
        icon: 'https://www.angelone.in/favicon.ico',
        color: 'from-blue-500 to-indigo-600',
        borderColor: 'border-blue-500/30',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        fields: [
            { key: 'apiKey', label: 'API Key', placeholder: 'Your Angel One SmartAPI Key' },
            { key: 'clientId', label: 'Client ID', placeholder: 'Your Angel One Client ID' },
            { key: 'password', label: 'Password', placeholder: 'Your Password', type: 'password' },
            { key: 'totp', label: 'TOTP', placeholder: 'Time-based OTP (optional)' }
        ]
    }
];

const BrokerConnect = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', message: '' }
    const [brokerStatus, setBrokerStatus] = useState({});
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check broker status on mount
    useEffect(() => {
        fetch('/api/broker?action=status')
            .then(res => res.json())
            .then(data => setBrokerStatus(data.brokers || {}))
            .catch(() => {});
    }, []);

    const handleConnect = async (broker) => {
        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch(`/api/broker?action=login&broker=${broker.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                setStatus({ type: 'success', message: `${broker.name} connected successfully!` });
                setBrokerStatus(prev => ({
                    ...prev,
                    [broker.id]: { ...prev[broker.id], connected: true }
                }));
                
                // For Zerodha, redirect to Kite login
                if (data.loginUrl && broker.id === 'zerodha') {
                    window.open(data.loginUrl, '_blank');
                }
            } else {
                setStatus({ type: 'error', message: data.error || 'Connection failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Could not reach broker API.' });
        } finally {
            setLoading(false);
        }
    };

    const anyConnected = Object.values(brokerStatus).some(b => b?.connected);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all duration-300 ${
                    anyConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-fintech-accent/10 text-fintech-accent border-fintech-accent/30 hover:bg-fintech-accent hover:text-white'
                }`}
            >
                <Link2 size={14} />
                {anyConnected ? 'Connected' : 'Connect Broker'}
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-fintech-darkCard border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-white font-semibold text-sm">Connect Your Broker</h4>
                                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">Link Zerodha or Angel One for live trading.</p>
                        </div>

                        <div className="p-3 space-y-2">
                            {BROKERS.map((broker) => {
                                const isSelected = selectedBroker?.id === broker.id;
                                const isConnected = brokerStatus[broker.id]?.connected;

                                return (
                                    <div key={broker.id}>
                                        <button
                                            onClick={() => setSelectedBroker(isSelected ? null : broker)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                                isSelected
                                                    ? `${broker.bgColor} ${broker.borderColor}`
                                                    : 'bg-fintech-primary/30 border-white/5 hover:border-white/15'
                                            }`}
                                        >
                                            <img src={broker.icon} alt={broker.name} className="w-5 h-5 rounded" onError={(e) => e.target.style.display = 'none' } />
                                            <span className="text-white text-sm font-medium flex-1 text-left">{broker.name}</span>
                                            {isConnected && (
                                                <CheckCircle2 size={16} className="text-emerald-400" />
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-3 pb-1 space-y-2">
                                                        {broker.fields.map((field) => (
                                                            <input
                                                                key={field.key}
                                                                type={field.type || 'text'}
                                                                placeholder={field.placeholder}
                                                                value={formData[field.key] || ''}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                                className="w-full bg-fintech-primary/40 text-white text-xs placeholder-slate-500 border border-white/10 rounded-lg px-3 py-2 focus:border-fintech-accent/50 outline-none"
                                                            />
                                                        ))}
                                                        <button
                                                            onClick={() => handleConnect(broker)}
                                                            disabled={loading}
                                                            className={`w-full bg-gradient-to-r ${broker.color} text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg`}
                                                        >
                                                            {loading ? (
                                                                <><Loader2 size={14} className="animate-spin" /> Connecting...</>
                                                            ) : (
                                                                `Connect ${broker.name}`
                                                            )}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {status && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`mx-3 mb-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                                        status.type === 'success'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}
                                >
                                    {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    {status.message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-3 border-t border-white/5">
                            <p className="text-slate-600 text-[10px] text-center">
                                Credentials are sent directly to broker APIs and never stored.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BrokerConnect;
