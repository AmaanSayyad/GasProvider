import React, { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import BalanceModal from "./BalanceModal";

const Header: React.FC = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { theme, toggleTheme } = useTheme();
  const [isBalancesOpen, setIsBalancesOpen] = useState(false);

  const handleConnect = (): void => {
    if (isConnected) {
      open({ view: "Account" });
    } else {
      open();
    }
  };

  const handleSwitchNetwork = (): void => {
    if (isConnected) {
      open({ view: "Networks" });
    } else {
      open();
    }
  };

  const formatAddress = (addr: `0x${string}` | undefined): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleLogoClick = () => {
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Optionally reset to first step if needed
    // You can add navigation logic here if you add routing later
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-theme pb-6 mb-8">
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
        title="Go to home"
      >
        <div className="p-2.5 bg-theme-muted rounded-2xl border border-theme backdrop-blur-md shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
          <span className="text-3xl">⛽</span>
        </div>
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-theme bg-gradient-to-r from-foreground via-foreground to-secondary bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all">
            Gas Provider
          </h1>
          <p className="text-sm text-secondary font-medium group-hover:text-theme transition-colors">
            Built to solve the problems of Millions.
          </p>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2.5 rounded-full font-medium transition-all bg-theme-muted border border-theme text-theme hover:bg-muted relative overflow-hidden"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative z-10"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-400" />
              )}
            </motion.div>
          </AnimatePresence>
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        </motion.button>
        <button
          onClick={() => setIsBalancesOpen(true)}
          className="px-5 py-2.5 rounded-full font-medium transition-colors bg-theme-muted border border-theme text-theme hover:bg-muted"
        >
          Show Balances
        </button>
        {isConnected && (
          <button
            onClick={handleSwitchNetwork}
            className="px-5 py-2.5 rounded-full font-medium transition-colors bg-theme-muted border border-theme text-theme hover:bg-muted"
            title="Switch Network"
          >
            Switch Chain
          </button>
        )}
        <button
          onClick={handleConnect}
          className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 backdrop-blur-md border ${
            isConnected
              ? "bg-theme-muted border-theme text-secondary hover:bg-muted"
              : "bg-primary/90 border-primary/50 text-white hover:bg-primary shadow-[0_0_20px_rgba(41,151,255,0.3)]"
          }`}
        >
          {isConnected ? formatAddress(address) : "Connect Wallet"}
        </button>
      </div>

      <BalanceModal isOpen={isBalancesOpen} onClose={() => setIsBalancesOpen(false)} />
    </div>
  );
};

export default Header;
