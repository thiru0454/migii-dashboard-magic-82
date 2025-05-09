
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  
  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    
    const selectedLang = availableLanguages.find(lang => lang.code === langCode);
    toast.success(t('changeLanguage'));
    
    // Force refresh components that might not be directly using the context
    document.documentElement.setAttribute('lang', langCode);
    
    // Optionally dispatch a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('languageChange', { detail: langCode }));
  };
  
  return (
    <div className="flex items-center gap-2">
      <Languages size={18} className="text-muted-foreground" />
      
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder={t('language')} />
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
