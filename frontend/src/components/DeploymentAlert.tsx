import React, { useState } from "react";
import { AlertTriangle, X, Video, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DeploymentAlert: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if we're on Vercel (or any production deployment)
  // Vercel sets VERCEL env var, or check hostname
  const isVercel = import.meta.env.VITE_VERCEL === "1" || 
                    window.location.hostname.includes("vercel.app");
  const isProduction = window.location.hostname !== "localhost" && 
                       window.location.hostname !== "127.0.0.1" &&
                       !window.location.hostname.startsWith("192.168.") &&
                       !window.location.hostname.startsWith("10.") &&
                       !window.location.hostname.startsWith("172.");
  
  // Allow testing on localhost by checking URL parameter or env var
  const showForTesting = new URLSearchParams(window.location.search).get("showAlert") === "true" ||
                         import.meta.env.VITE_SHOW_DEPLOYMENT_ALERT === "true";
  
  // TEMPORARY: Show on localhost for testing (remove this line before production)
  const forceShow = true; // Set to false to only show in production

  if (isDismissed || (!isProduction && !showForTesting && !forceShow)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mb-6"
      >
        <div className="glass-card border-2 border-amber-500/50 dark:border-amber-400/50 rounded-xl p-4 sm:p-5 backdrop-blur-md shadow-lg bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-red-500/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-theme mb-2 flex items-center gap-2">
                <span>⚠️ Limited Functionality on Live Version: https://gas-provider.vercel.app/</span>
              </h3>
              <p className="text-secondary mb-3 leading-relaxed">
                The version you're seeing is <strong className="text-theme">100% fully working on localhost</strong> as it requires Backend Docker Containers running. 
                {isVercel && " Due to limitations of Vercel (no Docker support, no long-running processes), "}
                {!isVercel && " Due to vercel deployment limitations (no Docker support, no long-running processes), "}
                you can't test application fully via live link.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href="https://github.com/AmaanSayyad/GasProvider"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/90 hover:bg-primary text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <Code className="w-4 h-4" />
                  <span>Run Locally</span>
                </a>
                <a
                  href="https://drive.google.com/drive/folders/1rIZRX5qmV7Qz7Zlfo_Mx9vs1N2ryv9Sx?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-theme-muted hover:bg-muted border border-theme text-theme rounded-lg font-medium transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>Watch Demo Video</span>
                </a>
              </div>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-theme-muted transition-colors text-secondary hover:text-theme"
              aria-label="Dismiss alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeploymentAlert;

