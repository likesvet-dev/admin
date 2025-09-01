'use client';

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function DynamicThemeColor() {
    const { theme } = useTheme();

    useEffect(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;

        if (theme === "dark") {
            meta.setAttribute("content", "var(--background)");
        } else {
            meta.setAttribute("content", "var(--background)");
        }
    }, [theme]);

    return null;
}