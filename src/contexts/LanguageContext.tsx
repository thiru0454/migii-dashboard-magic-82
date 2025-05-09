
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define available languages
export const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' }
];

// Define translations
const translations: Record<string, Record<string, string>> = {
  en: {
    welcome: 'Welcome to MIGII',
    settings: 'Settings',
    language: 'Language',
    changeLanguage: 'Language changed successfully',
    dashboard: 'Dashboard',
    workers: 'Workers',
    jobs: 'Jobs',
    location: 'Location',
    analytics: 'Analytics',
    settings: 'Settings',
    logout: 'Logout',
    assign: 'Assign',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    skill: 'Skill',
    search: 'Search',
    workerDetails: 'Worker Details',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    register: 'Register',
    login: 'Login'
  },
  ta: {
    welcome: 'MIGII-க்கு வரவேற்கிறோம்',
    settings: 'அமைப்புகள்',
    language: 'மொழி',
    changeLanguage: 'மொழி வெற்றிகரமாக மாற்றப்பட்டது',
    dashboard: 'டாஷ்போர்டு',
    workers: 'தொழிலாளர்கள்',
    jobs: 'வேலைகள்',
    location: 'இடம்',
    analytics: 'பகுப்பாய்வு',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    assign: 'நியமி',
    status: 'நிலை',
    active: 'செயலில்',
    inactive: 'செயலற்றது',
    skill: 'திறன்',
    search: 'தேடு',
    workerDetails: 'தொழிலாளர் விவரங்கள்',
    edit: 'திருத்து',
    delete: 'அழி',
    cancel: 'ரத்து செய்',
    save: 'சேமி',
    register: 'பதிவு செய்',
    login: 'உள்நுழை'
  },
  hi: {
    welcome: 'MIGII में आपका स्वागत है',
    settings: 'समायोजन',
    language: 'भाषा',
    changeLanguage: 'भाषा सफलतापूर्वक बदल दी गई है',
    dashboard: 'डैशबोर्ड',
    workers: 'कामगार',
    jobs: 'नौकरियां',
    location: 'स्थान',
    analytics: 'विश्लेषण',
    settings: 'समायोजन',
    logout: 'लॉग आउट',
    assign: 'असाइन करें',
    status: 'स्थिति',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    skill: 'कौशल',
    search: 'खोज',
    workerDetails: 'कामगार विवरण',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    register: 'पंजीकरण करें',
    login: 'लॉगिन'
  },
  // Add other languages as needed
  te: {
    welcome: 'MIGII కి స్వాగతం',
    settings: 'సెట్టింగ్‌లు',
    language: 'భాష',
    changeLanguage: 'భాష విజయవంతంగా మార్చబడింది',
    dashboard: 'డాష్‌బోర్డ్',
    workers: 'కార్మికులు',
    jobs: 'ఉద్యోగాలు',
    location: 'స్థానం',
    analytics: 'విశ్లేషణలు',
    settings: 'సెట్టింగ్‌లు',
    logout: 'లాగ్ అవుట్',
    assign: 'కేటాయించు',
    status: 'స్థితి',
    active: 'క్రియాశీల',
    inactive: 'క్రియాహీనమైన',
    skill: 'నైపుణ్యం',
    search: 'శోధించు',
    workerDetails: 'కార్మికుని వివరాలు',
    edit: 'సవరించు',
    delete: 'తొలగించు',
    cancel: 'రద్దు',
    save: 'సేవ్',
    register: 'నమోదు',
    login: 'లాగిన్'
  },
  kn: {
    welcome: 'MIGII ಗೆ ಸುಸ್ವಾಗತ',
    settings: 'ಸೆಟ್ಟಿಂಗ್ಗಳು',
    language: 'ಭಾಷೆ',
    changeLanguage: 'ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ',
    dashboard: 'ಡ್ಯಾಶ್ಬೋರ್ಡ್',
    workers: 'ಕಾರ್ಮಿಕರು',
    jobs: 'ಉದ್ಯೋಗಗಳು',
    location: 'ಸ್ಥಳ',
    analytics: 'ವಿಶ್ಲೇಷಣೆಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್ಗಳು',
    logout: 'ಲಾಗ್ ಔಟ್',
    assign: 'ನಿಯೋಜಿಸಿ',
    status: 'ಸ್ಥಿತಿ',
    active: 'ಸಕ್ರಿಯ',
    inactive: 'ನಿಷ್ಕ್ರಿಯ',
    skill: 'ಕೌಶಲ್ಯ',
    search: 'ಹುಡುಕಿ',
    workerDetails: 'ಕಾರ್ಮಿಕರ ವಿವರಗಳು',
    edit: 'ಸಂಪಾದಿಸಿ',
    delete: 'ಅಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    save: 'ಉಳಿಸಿ',
    register: 'ನೋಂದಣಿ',
    login: 'ಲಾಗಿನ್'
  },
  ml: {
    welcome: 'MIGII ലേക്ക് സ്വാഗതം',
    settings: 'ക്രമീകരണങ്ങൾ',
    language: 'ഭാഷ',
    changeLanguage: 'ഭാഷ വിജയകരമായി മാറ്റി',
    dashboard: 'ഡാഷ്ബോർഡ്',
    workers: 'തൊഴിലാളികൾ',
    jobs: 'ജോലികൾ',
    location: 'സ്ഥാനം',
    analytics: 'അനലിറ്റിക്സ്',
    settings: 'ക്രമീകരണങ്ങൾ',
    logout: 'പുറത്തുകടക്കുക',
    assign: 'നിയോഗിക്കുക',
    status: 'നില',
    active: 'സജീവമാണ്',
    inactive: 'നിഷ്ക്രിയമാണ്',
    skill: 'കഴിവ്',
    search: 'തിരയുക',
    workerDetails: 'തൊഴിലാളി വിശദാംശങ്ങൾ',
    edit: 'എഡിറ്റ് ചെയ്യുക',
    delete: 'ഇല്ലാതാക്കുക',
    cancel: 'റദ്ദാക്കുക',
    save: 'സംരക്ഷിക്കുക',
    register: 'രജിസ്റ്റർ ചെയ്യുക',
    login: 'ലോഗിൻ'
  }
};

// Create the language context
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  availableLanguages: typeof availableLanguages;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  availableLanguages: []
});

// Create provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get saved language from localStorage or use default
  const [language, setLanguageState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'en';
    }
    return 'en';
  });

  // Update language and save to localStorage
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      
      // Store language preference in Supabase if user is authenticated
      const currentUser = supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const userId = data.user.id;
          // Update user preferences in Supabase
          supabase.from('user_preferences').upsert({
            user_id: userId,
            preferred_language: lang,
            updated_at: new Date().toISOString()
          }).then(({ error }) => {
            if (error) {
              console.error('Failed to save language preference:', error);
            }
          });
        }
      });
    }
  };

  // Translation function
  const t = (key: string): string => {
    if (!translations[language] || !translations[language][key]) {
      // Fallback to English if translation not found
      return translations['en'][key] || key;
    }
    return translations[language][key];
  };

  // When component mounts, try to get language preference from Supabase
  useEffect(() => {
    const syncLanguageWithSupabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('preferred_language')
            .eq('user_id', user.id)
            .single();
            
          if (!error && data?.preferred_language) {
            setLanguageState(data.preferred_language);
            localStorage.setItem('language', data.preferred_language);
          }
        }
      } catch (error) {
        console.error('Error syncing language with Supabase:', error);
      }
    };
    
    syncLanguageWithSupabase();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);
