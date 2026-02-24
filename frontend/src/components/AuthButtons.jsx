"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Check, LogIn, LogOut, X } from "lucide-react";
import { useState } from "react";

const smoothSpring = {
    type: "spring",
    bounce: 0,
    duration: 0.35,
};

export function LogoutButton({ className = "" }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleLogoutClick = () => {
        setIsExpanded(true);
    };

    const handleConfirm = () => {
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/");
        });
        location.reload();
    };

    const handleCancel = () => {
        setIsExpanded(false);
    };

    return (
        <MotionConfig transition={smoothSpring}>
            <motion.div
                layout
                className={cn("relative inline-flex items-center gap-2", className)}
            >
                <motion.div
                    layout
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <button
                        className={cn(
                            "h-9 text-xs px-4 inline-flex items-center justify-center rounded-xl font-bold transition-shadow cursor-pointer text-white",
                            isExpanded
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-red-500 hover:bg-red-600"
                        )}
                        onClick={isExpanded ? handleConfirm : handleLogoutClick}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={isExpanded ? "check-icon" : "logout-icon"}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="mr-2 flex items-center"
                            >
                                {isExpanded ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <LogOut className="h-3.5 w-3.5" />
                                )}
                            </motion.span>
                        </AnimatePresence>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={isExpanded ? "confirm" : "logout"}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                {isExpanded ? "Confirm" : "Log out"}
                            </motion.span>
                        </AnimatePresence>
                    </button>
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {isExpanded && (
                        <motion.div
                            key="cancel-button"
                            layout
                            initial={{ opacity: 0, scale: 0.8, x: -8 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <button
                                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted cursor-pointer transition-shadow"
                                onClick={handleCancel}
                                aria-label="Cancel"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </MotionConfig>
    );
}

export function LoginButton({ className = "" }) {
    const handleLogin = () => {
        document.cookie = "user_id=; path=/; max-age=0";
        location.reload();
    };

    return (
        <MotionConfig transition={smoothSpring}>
            <motion.div
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn("inline-flex", className)}
            >
                <button
                    className="h-9 text-xs px-5 inline-flex items-center justify-center rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all cursor-pointer active:scale-95"
                    onClick={handleLogin}
                >
                    <LogIn className="h-3.5 w-3.5 mr-2" />
                    Login
                </button>
            </motion.div>
        </MotionConfig>
    );
}
