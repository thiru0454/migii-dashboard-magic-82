
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslateProps {
  keyName: string;
  children?: React.ReactNode; // Optional fallback content
}

export const T: React.FC<TranslateProps> = ({ keyName, children }) => {
  const { t } = useLanguage();
  const translated = t(keyName);
  
  // If there's no translation and children are provided, use children as fallback
  if (translated === keyName && children) {
    return <>{children}</>;
  }
  
  return <>{translated}</>;
};
