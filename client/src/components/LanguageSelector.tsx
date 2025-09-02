import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-language-selector">
          <Globe className="h-4 w-4" />
          {language === 'en' ? t.english : t.swedish}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'bg-accent' : ''}
          data-testid="option-english"
        >
          🇺🇸 {t.english}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('sv')}
          className={language === 'sv' ? 'bg-accent' : ''}
          data-testid="option-swedish"
        >
          🇸🇪 {t.swedish}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}