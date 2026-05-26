import { cn } from "@/lib/utils";

export default function MouseEffectCard({ className = "", children }) {
    return (
        <div className={cn("relative w-full isolate overflow-hidden", className)}>
            <div className="relative z-10 w-full">{children}</div>
        </div>
    );
}
