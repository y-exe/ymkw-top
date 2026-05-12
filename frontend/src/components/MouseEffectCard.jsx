import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function MouseEffectCard({ className = "", children }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDark, setIsDark] = useState(false);

    // Watch for dark class changes on <html> element
    useEffect(() => {
        const html = document.documentElement;
        const checkDark = () => setIsDark(html.classList.contains("dark"));
        checkDark();

        const observer = new MutationObserver(checkDark);
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let dots = [];
        let animationFrameId;
        let time = 0;

        const FIXED_SPACING = 28;
        const FIXED_DOT_SIZE = 1.6;
        const ANIMATION_SPEED = 0.035;

        const resizeCanvas = () => {
            const container = containerRef.current;
            if (!container || !ctx) return;
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            dots = [];
            const cols = Math.ceil(rect.width / FIXED_SPACING);
            const rows = Math.ceil(rect.height / FIXED_SPACING);
            for (let i = 0; i <= cols; i++) {
                for (let j = 0; j <= rows; j++) {
                    dots.push({
                        x: i * FIXED_SPACING,
                        y: j * FIXED_SPACING,
                        phase: Math.random() * Math.PI * 2,
                        speed: 0.5 + Math.random() * 0.5,
                        baseOpacity: 0.2 + Math.random() * 0.3,
                    });
                }
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = isDark
                ? "rgba(160, 160, 160, 1)"
                : "rgba(100, 100, 100, 1)";

            time += ANIMATION_SPEED;
            dots.forEach((dot) => {
                const scale = (Math.sin(time * dot.speed + dot.phase) + 1) / 2;
                ctx.globalAlpha = dot.baseOpacity + scale * 0.45;
                ctx.fillRect(dot.x, dot.y, FIXED_DOT_SIZE, FIXED_DOT_SIZE);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        const observer = new ResizeObserver(resizeCanvas);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        resizeCanvas();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, [isDark]);

    return (
        <div ref={containerRef} className={cn("relative w-full h-full isolate", className)}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ width: "100%", height: "100%" }}
            />
            <div className="relative z-10 h-full w-full">{children}</div>
        </div>
    );
}
