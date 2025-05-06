import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// Define available languages
export const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' }
];

// Define the translations interface
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Our translations object with keys for each language
const translations: Translations = {
  en: {
    welcome: 'Welcome to Migii',
    dashboard: 'Dashboard',
    workers: 'Workers',
    location: 'Location',
    analytics: 'Analytics',
    settings: 'Settings',
    totalWorkers: 'Total Workers',
    activeWorkers: 'Active Workers',
    back: 'Back',
    search: 'Search',
    customerSupport: 'Customer Support',
    needHelp: 'Need help?',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    assign: 'Assign',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    changeLanguage: 'Language changed to English'
  },
  es: {
    welcome: 'Bienvenido a Migii',
    dashboard: 'Panel de Control',
    workers: 'Trabajadores',
    location: 'Ubicación',
    analytics: 'Análisis',
    settings: 'Ajustes',
    totalWorkers: 'Trabajadores Totales',
    activeWorkers: 'Trabajadores Activos',
    back: 'Volver',
    search: 'Buscar',
    customerSupport: 'Atención al Cliente',
    needHelp: '¿Necesitas ayuda?',
    name: 'Nombre',
    email: 'Correo',
    phone: 'Teléfono',
    status: 'Estado',
    actions: 'Acciones',
    edit: 'Editar',
    delete: 'Eliminar',
    assign: 'Asignar',
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',
    changeLanguage: 'Idioma cambiado a Español'
  },
  hi: {
    welcome: 'मिगी में आपका स्वागत है',
    dashboard: 'डैशबोर्ड',
    workers: 'कर्मचारी',
    location: 'स्थान',
    analytics: 'विश्लेषण',
    settings: 'सेटिंग्स',
    totalWorkers: 'कुल कर्मचारी',
    activeWorkers: 'सक्रिय कर्मचारी',
    back: 'वापस',
    search: 'खोजें',
    customerSupport: 'ग्राहक सहायता',
    needHelp: 'मदद चाहिए?',
    name: 'नाम',
    email: 'ईमेल',
    phone: 'फोन',
    status: 'स्थिति',
    actions: 'क्रियाएँ',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    assign: 'असाइन करें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...',
    login: 'लॉगिन',
    register: 'पंजीकरण',
    logout: 'लॉगआउट',
    changeLanguage: 'भाषा हिंदी में बदली गई'
  },
  bn: {
    welcome: 'মিগি তে স্বাগতম',
    dashboard: 'ড্যাশবোর্ড',
    workers: 'কর্মীরা',
    location: 'অবস্থান',
    analytics: 'বিশ্লেষণ',
    settings: 'সেটিংস',
    totalWorkers: 'মোট কর্মী',
    activeWorkers: 'সক্রিয় কর্মী',
    back: 'পিছনে',
    search: 'অনুসন্ধান',
    customerSupport: 'গ্রাহক সহায়তা',
    needHelp: 'সাহায্য দরকার?',
    name: 'নাম',
    email: 'ইমেইল',
    phone: 'ফোন',
    status: 'অবস্থা',
    actions: 'কার্যক্রম',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    assign: 'নিয়োগ',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    loading: 'লোড হচ্ছে...',
    login: 'লগইন',
    register: 'নিবন্ধন',
    logout: 'লগআউট',
    changeLanguage: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে'
  },
  ta: {
    welcome: 'மிகிக்கு வரவேற்கிறோம்',
    dashboard: 'டாஷ்போர்டு',
    workers: 'தொழிலாளர்கள்',
    location: 'இடம்',
    analytics: 'பகுப்பாய்வு',
    settings: 'அமைப்புகள்',
    totalWorkers: 'மொத்த தொழிலாளர்கள்',
    activeWorkers: 'செயலில் உள்ள தொழிலாளர்கள்',
    back: 'பின் செல்',
    search: 'தேடு',
    customerSupport: 'வாடிக்கையாளர் ஆதரவு',
    needHelp: 'உதவி தேவையா?',
    name: 'பெயர்',
    email: 'மின்னஞ்சல்',
    phone: 'தொலைபேசி',
    status: 'நிலை',
    actions: 'செயல்கள்',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    assign: 'ஒதுக்கு',
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    loading: 'ஏற்றுகிறது...',
    login: 'உள்நுழைக',
    register: 'பதிவு செய்க',
    logout: 'வெளியேறு',
    changeLanguage: 'மொழி தமிழுக்கு மாற்றப்பட்டது'
  }
};

// Define the context type
interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  getLanguageName: (code: string) => string | undefined;
}

// Create the context
export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  getLanguageName: () => ''
});

// Create the provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Load saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    setLanguage(savedLang);
  }, []);

  // Function to get a translation
  const t = (key: string): string => {
    if (!translations[language]) {
      console.warn(`No translations available for language: ${language}`);
      return translations.en[key] || key;
    }
    
    return translations[language][key] || translations.en[key] || key;
  };

  // Function to get language name from code
  const getLanguageName = (code: string): string | undefined => {
    const lang = availableLanguages.find(lang => lang.code === code);
    return lang?.name;
  };

  // Handle language change
  const handleSetLanguage = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
    
    // We'll keep the toast message handling in the LanguageSelector component
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, getLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};
