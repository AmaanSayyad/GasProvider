import React, { useEffect } from "react";
import { X, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UnifiedBalance from "./unified-balance/unified-balance";
import { useNexus } from "./nexus/NexusProvider";

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BalanceModal: React.FC<BalanceModalProps> = ({ isOpen, onClose }) => {
  const { fetchUnifiedBalance } = useNexus();

  // Force refresh balances when modal opens
  useEffect(() => {
    if (isOpen && fetchUnifiedBalance) {
      console.log("Balance modal opened, refreshing balances from all chains...");
      // Small delay to ensure modal is rendered
      const timeoutId = setTimeout(() => {
        fetchUnifiedBalance().catch((error) => {
          console.error("Error refreshing balances when opening modal:", error);
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, fetchUnifiedBalance]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl glass-card border border-theme rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-theme flex items-center justify-between sticky top-0 bg-theme-muted z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-muted rounded-2xl border border-theme">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-theme">Balances</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto custom-scrollbar">
            <UnifiedBalance className="max-w-full mx-0 mb-0" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BalanceModal;


