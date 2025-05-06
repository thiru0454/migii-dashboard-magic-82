
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language } from 'lucide-react';
import { toast } from 'sonner';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' }
];

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('en');
  
  // Load language preference on component mount
  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    setCurrentLang(savedLang);
  }, []);
  
  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    
    const selectedLang = languages.find(lang => lang.code === langCode);
    toast.success(`Language changed to ${selectedLang?.name}`);
    
    // In a real app, this would trigger translations to be loaded
    // and the UI to be updated accordingly
  };
  
  return (
    <div className="flex items-center gap-2">
      <Language size={18} className="text-muted-foreground" />
      
      <Select value={currentLang} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
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
