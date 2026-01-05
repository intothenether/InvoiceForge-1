import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { t } = useLanguage();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Load theme from localStorage
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const initialTheme = storedTheme || 'light';
        setTheme(initialTheme);

        // Apply theme to document
        if (initialTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        // Toggle dark class on html element
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? t.darkMode : t.lightMode}
        >
            {theme === 'light' ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </Button>
    );
}
