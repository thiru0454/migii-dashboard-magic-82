import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

export const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
];

// All translations
const translations = {
  en: {
    // Common
    dashboard: 'Dashboard',
    workers: 'Workers',
    location: 'Location',
    analytics: 'Analytics',
    settings: 'Settings',
    loading: 'Loading...',
    totalWorkers: 'Total Workers',
    activeWorkers: 'Active Workers',
    changeLanguage: 'Language changed successfully',
    
    // New Home Page
    heroBannerTitle: 'One Nation, One Identity – Migii for Every Migrant Worker',
    heroBannerSubtitle: 'Connecting workers with jobs, ensuring security, and providing support across India',
    joinNow: 'Join Now',
    postJob: 'Post a Job',
    trackStatus: 'Track My Status',
    
    selectYourRole: 'Quick Access Role Selector',
    worker: 'Worker',
    employer: 'Business/Employer',
    admin: 'Admin',
    workerDescription: 'Find Work Nearby',
    employerDescription: 'Hire Verified Workers',
    adminDescription: 'Monitor Region Data',
    
    liveStatistics: 'Live Dashboard Counters',
    registeredWorkers: 'Total Registered Workers',
    jobsPosted: 'Jobs Posted This Month',
    jobsFilled: 'Jobs Filled',
    regionsCovered: 'Regions Covered',
    languagesSupported: 'Languages Supported',
    grievancesResolved: 'Grievances Resolved',
    
    searchTitle: 'Smart Search',
    searchPlaceholder: 'Search for jobs, workers, or check status...',
    search: 'Search',
    jobs: 'Jobs',
    status: 'Status',
    filterLanguage: 'Language',
    filterSkills: 'Skills',
    filterLocation: 'Location',
    filterExperience: 'Experience',
    
    keyFeatures: 'Highlighted Features',
    featureDigitalID: 'Secure Digital ID',
    featureTracking: 'Real-time Tracking',
    featureMultilingual: 'Multilingual Support',
    featureMobile: 'Mobile-friendly',
    featureGrievance: 'Grievance Redressal',
    featureDigitalIDDesc: 'QR code-based identity verification',
    featureTrackingDesc: 'GPS/IoT enabled location tracking',
    featureMultilingualDesc: 'Support for 12 Indian languages',
    featureMobileDesc: 'Access from any device anywhere',
    featureGrievanceDesc: 'Quick resolution of complaints',
    
    migrantServices: 'Migrant Services',
    serviceFindJobs: 'Find Jobs',
    serviceRegister: 'Register as Worker',
    serviceVerify: 'Verify Worker ID',
    serviceLocate: 'Locate Help Center',
    serviceRights: 'Know Your Rights',
    serviceSupport: 'Support Center',
    serviceFindJobsDesc: 'Login required',
    serviceRegisterDesc: 'Quick simple process',
    serviceVerifyDesc: 'For employers',
    serviceLocateDesc: 'Nearest assistance',
    serviceRightsDesc: 'Labor laws explained',
    serviceSupportDesc: '24/7 assistance',
    
    successStories: 'Success Stories',
    newsUpdates: 'News & Updates',
    readMore: 'Read Full Story',
    
    appPromoTitle: 'Get the Migii Mobile App',
    appPromoDesc: 'Access all services offline, receive job alerts, and track your application status',
    androidApp: 'Android App',
    iOSApp: 'iOS App',
    scanQRCode: 'Scan QR Code',
    
    helpSupport: 'Help & Support Center',
    frequentlyAsked: 'Frequently Asked Questions',
    viewAllFAQs: 'View All FAQs',
    contactUs: 'Contact Us',
    emergencyHelpline: 'Emergency Helpline',
    yourName: 'Your Name',
    yourEmail: 'Your Email',
    yourQuery: 'Your Query',
    submit: 'Submit',
    responseTime: 'We typically respond within 24 hours',
    
    aboutUs: 'About Us',
    partners: 'Partners',
    resources: 'Resources',
    legal: 'Legal',
    ourMission: 'Our Mission',
    howItWorks: 'How It Works',
    team: 'Team',
    governmentAgencies: 'Government Agencies',
    NGOs: 'NGOs',
    corporates: 'Corporates',
    blog: 'Blog',
    pressReleases: 'Press Releases',
    reports: 'Reports',
    privacyPolicy: 'Privacy Policy',
    termsOfUse: 'Terms of Use',
    disclaimer: 'Disclaimer',
    allRightsReserved: 'All Rights Reserved'
  },
  hi: {
    // Common
    dashboard: 'डैशबोर्ड',
    workers: 'कामगार',
    location: 'स्थान',
    analytics: 'विश्लेषण',
    settings: 'सेटिंग्स',
    loading: 'लोड हो रहा है...',
    totalWorkers: 'कुल कामगार',
    activeWorkers: 'सक्रिय कामगार',
    changeLanguage: 'भाषा सफलतापूर्वक बदल दी गई',
    
    // New Home Page
    heroBannerTitle: 'एक राष्ट्र, एक पहचान – हर प्रवासी कामगार के लिए मिगी',
    heroBannerSubtitle: 'कामगारों को नौकरियों से जोड़ना, सुरक्षा सुनिश्चित करना, और पूरे भारत में सहायता प्रदान करना',
    joinNow: 'अभी जुड़ें',
    postJob: 'नौकरी पोस्ट करें',
    trackStatus: 'स्थिति ट्रैक करें',
    
    selectYourRole: 'त्वरित पहुंच भूमिका चयनकर्ता',
    worker: 'कामगार',
    employer: 'व्यापार/नियोक्ता',
    admin: 'प्रशासक',
    workerDescription: 'पास में काम खोजें',
    employerDescription: 'सत्यापित कामगारों को नियुक्त करें',
    adminDescription: 'क्षेत्र डेटा की निगरानी करें',
    
    liveStatistics: 'लाइव डैशबोर्ड काउंटर',
    registeredWorkers: 'कुल पंजीकृत कामगार',
    jobsPosted: 'इस महीने पोस्ट की गई नौकरियां',
    jobsFilled: 'भरी गई नौकरियां',
    regionsCovered: 'कवर किए गए क्षेत्र',
    languagesSupported: 'समर्थित भाषाएँ',
    grievancesResolved: 'निवारित शिकायतें',
    
    searchTitle: 'स्मार्ट खोज',
    searchPlaceholder: 'नौकरियों, कामगारों या स्थिति की जाँच के लिए खोजें...',
    search: 'खोजें',
    jobs: 'नौकरियां',
    status: 'स्थिति',
    filterLanguage: 'भाषा',
    filterSkills: 'कौशल',
    filterLocation: 'स्थान',
    filterExperience: 'अनुभव',
    
    keyFeatures: 'मुख्य विशेषताएं',
    featureDigitalID: 'सुरक्षित डिजिटल आईडी',
    featureTracking: 'रियल-टाइम ट्रैकिंग',
    featureMultilingual: 'बहुभाषी समर्थन',
    featureMobile: 'मोबाइल-अनुकूल',
    featureGrievance: 'शिकायत निवारण',
    featureDigitalIDDesc: 'QR कोड-आधारित पहचान सत्यापन',
    featureTrackingDesc: 'GPS/IoT सक्षम स्थान ट्रैकिंग',
    featureMultilingualDesc: '12 भारतीय भाषाओं के लिए समर्थन',
    featureMobileDesc: 'किसी भी डिवाइस से कहीं भी एक्सेस करें',
    featureGrievanceDesc: 'शिकायतों का त्वरित समाधान',
    
    migrantServices: 'प्रवासी सेवाएं',
    serviceFindJobs: 'नौकरियां खोजें',
    serviceRegister: 'कामगार के रूप में पंजीकरण करें',
    serviceVerify: 'कामगार आईडी सत्यापित करें',
    serviceLocate: 'सहायता केंद्र ढूंढें',
    serviceRights: 'अपने अधिकार जानें',
    serviceSupport: 'सहायता केंद्र',
    serviceFindJobsDesc: 'लॉगिन आवश्यक है',
    serviceRegisterDesc: 'त्वरित सरल प्रक्रिया',
    serviceVerifyDesc: 'नियोक्ताओं के लिए',
    serviceLocateDesc: 'निकटतम सहायता',
    serviceRightsDesc: 'श्रम कानून समझाए गए',
    serviceSupportDesc: '24/7 सहायता',
    
    successStories: 'सफलता की कहानियां',
    newsUpdates: 'समाचार और अपडेट',
    readMore: 'पूरी कहानी पढ़ें',
    
    appPromoTitle: 'मिगी मोबाइल ऐप प्राप्त करें',
    appPromoDesc: 'सभी सेवाओं तक ऑफलाइन पहुंच प्राप्त करें, नौकरी अलर्ट प्राप्त करें और अपने आवेदन की स्थिति को ट्रैक करें',
    androidApp: 'एंड्रॉइड ऐप',
    iOSApp: 'आईओएस ऐप',
    scanQRCode: 'QR कोड स्कैन करें',
    
    helpSupport: 'सहायता और समर्थन केंद्र',
    frequentlyAsked: 'अक्सर पूछे जाने वाले प्रश्न',
    viewAllFAQs: 'सभी प्रश्न देखें',
    contactUs: 'संपर्क करें',
    emergencyHelpline: 'आपातकालीन हेल्पलाइन',
    yourName: 'आपका नाम',
    yourEmail: 'आपका ईमेल',
    yourQuery: 'आपका प्रश्न',
    submit: 'जमा करें',
    responseTime: 'हम आमतौर पर 24 घंटों के भीतर प्रतिक्रिया देते हैं',
    
    aboutUs: 'हमारे बारे में',
    partners: 'साझेदार',
    resources: 'संसाधन',
    legal: 'कानूनी',
    ourMission: 'हमारा मिशन',
    howItWorks: 'यह कैसे काम करता है',
    team: 'टीम',
    governmentAgencies: 'सरकारी एजेंसियां',
    NGOs: 'गैर-सरकारी संगठन',
    corporates: 'कॉर्पोरेट',
    blog: 'ब्लॉग',
    pressReleases: 'प्रेस विज्ञप्ति',
    reports: 'रिपोर्ट',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfUse: 'उपयोग की शर्तें',
    disclaimer: 'अस्वीकरण',
    allRightsReserved: 'सर्वाधिकार सुरक्षित'
  },
  ta: {
    // Common
    dashboard: 'டாஷ்போர்டு',
    workers: 'தொழிலாளர்கள்',
    location: 'இருப்பிடம்',
    analytics: 'பகுப்பாய்வு',
    settings: 'அமைப்புகள்',
    loading: 'ஏற்றுகிறது...',
    totalWorkers: 'மொத்த தொழிலாளர்கள்',
    activeWorkers: 'செயலில் உள்ள தொழிலாளர்கள்',
    changeLanguage: 'மொழி வெற்றிகரமாக மாற்றப்பட்டது',
    
    // New Home Page
    heroBannerTitle: 'ஒரு நாடு, ஒரு அடையாளம் - ஒவ்வொரு புலம்பெயர் தொழிலாளருக்கும் மிகி',
    heroBannerSubtitle: 'தொழிலாளர்களை வேலைகளுடன் இணைப்பது, பாதுகாப்பை உறுதிப்படுத்துவது மற்றும் இந்தியா முழுவதும் ஆதரவை வழங்குவது',
    joinNow: 'இப்போது சேரவும்',
    postJob: 'வேலை பதிவிடவும்',
    trackStatus: 'என் நிலையைக் கண்காணிக்கவும்',
    
    selectYourRole: 'விரைவு அணுகல் பங்கு தேர்வாளர்',
    worker: 'தொழிலாளர்',
    employer: 'வணிகம்/முதலாளி',
    admin: 'நிர்வாகி',
    workerDescription: 'அருகிலுள்ள வேலையைக் கண்டறியவும்',
    employerDescription: 'சரிபார்க்கப்பட்ட தொழிலாளர்களை நியமித்தவும்',
    adminDescription: 'பகுதி தரவைக் கண்காணிக்கவும்',
    
    liveStatistics: 'நேரடி டாஷ்போர்டு எண்ணிக்கைகள்',
    registeredWorkers: 'மொத்த பதிவுசெய்யப்பட்ட தொழிலாளர்கள்',
    jobsPosted: 'இந்த மாதம் பதிவிடப்பட்ட வேலைகள்',
    jobsFilled: 'நிரப்பப்பட்ட வேலைகள்',
    regionsCovered: 'உள்ளடக்கிய பகுதிகள்',
    languagesSupported: 'ஆதரிக்கப்படும் மொழிகள்',
    grievancesResolved: 'தீர்க்கப்பட்ட குறைகள்',
    
    searchTitle: 'ஸ்மார்ட் தேடல்',
    searchPlaceholder: 'வேலைகள், தொழிலாளர்கள் அல்லது நிலையை தேடுங்கள்...',
    search: 'தேடு',
    jobs: 'வேலைகள்',
    status: 'நிலை',
    filterLanguage: 'மொழி',
    filterSkills: 'திறன்கள்',
    filterLocation: 'இருப்பிடம்',
    filterExperience: 'அனுபவம்',
    
    keyFeatures: 'சிறப்பம்சங்கள்',
    featureDigitalID: 'பாதுகாப்பான டிஜிட்டல் அடையாளம்',
    featureTracking: 'நேரலை கண்காணிப்பு',
    featureMultilingual: 'பல மொழி ஆதரவு',
    featureMobile: 'மொபைல் நட்பு',
    featureGrievance: 'குறை தீர்வு',
    featureDigitalIDDesc: 'QR குறியீடு அடிப்படையிலான அடையாள சரிபார்ப்பு',
    featureTrackingDesc: 'GPS/IoT இயக்கப்பட்ட இருப்பிட கண்காணிப்பு',
    featureMultilingualDesc: '12 இந்திய மொழிகளுக்கு ஆதரவு',
    featureMobileDesc: 'எந்த சாதனத்திலிருந்தும் எங்கிருந்தும் அணுகவும்',
    featureGrievanceDesc: 'புகார்களின் விரைவான தீர்வு',
    
    migrantServices: 'புலம்பெயர்ந்தோர் சேவைகள்',
    serviceFindJobs: 'வேலைகளைக் கண்டறியவும்',
    serviceRegister: 'தொழிலாளியாக பதிவு செய்யுங்கள்',
    serviceVerify: 'தொழிலாளர் அடையாளத்தை சரிபார்க்கவும்',
    serviceLocate: 'உதவி மையத்தைக் கண்டறியவும்',
    serviceRights: 'உங்கள் உரிமைகளை அறிந்து கொள்ளுங்கள்',
    serviceSupport: 'ஆதரவு மையம்',
    serviceFindJobsDesc: 'உள்நுழைவு தேவை',
    serviceRegisterDesc: 'விரைவான எளிய செயல்முறை',
    serviceVerifyDesc: 'முதலாளிகளுக்கு',
    serviceLocateDesc: 'அருகிலுள்ள உதவி',
    serviceRightsDesc: 'தொழிலாளர் சட்டங்கள் விளக்கப்பட்டுள்ளன',
    serviceSupportDesc: '24/7 உதவி',
    
    successStories: 'வெற்றிக் கதைகள்',
    newsUpdates: 'செய்திகள் & புதுப்பிப்புகள்',
    readMore: 'முழு கதையையும் படிக்கவும்',
    
    appPromoTitle: 'மிகி மொபைல் ஆப்ஸைப் பெறுங்கள்',
    appPromoDesc: 'அனைத்து சேவைகளையும் ஆஃப்லைனில் அணுகவும், வேலை விழிப்பூட்டல்களைப் பெறவும், உங்கள் விண்ணப்ப நிலையைக் கண்காணிக்கவும்',
    androidApp: 'ஆண்ட்ராய்டு ஆப்',
    iOSApp: 'iOS ஆப்',
    scanQRCode: 'QR குறியீட்டை ஸ்கேன் செய்யவும்',
    
    helpSupport: 'உதவி & ஆதரவு மையம்',
    frequentlyAsked: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    viewAllFAQs: 'அனைத்து FAQகளையும் காண்க',
    contactUs: 'எங்களை தொடர்பு கொள்ளவும்',
    emergencyHelpline: 'அவசர உதவி எண்',
    yourName: 'உங்கள் பெயர்',
    yourEmail: 'உங்கள் மின்னஞ்சல்',
    yourQuery: 'உங்கள் கேள்வி',
    submit: 'சமர்ப்பிக்கவும்',
    responseTime: 'நாங்கள் பொதுவாக 24 மணி நேரத்திற்குள் பதிலளிப்போம்',
    
    aboutUs: 'எங்களைப் பற்றி',
    partners: 'பங்காளர்கள்',
    resources: 'ஸம்ப஦',
    legal: 'சட்ட',
    ourMission: 'எங்கள் நோக்கம்',
    howItWorks: 'இது எப்படி வேலை செய்கிறது',
    team: 'குழு',
    governmentAgencies: 'அரசு நிறுவனங்கள்',
    NGOs: 'தன்னார்வ நிறுவனங்கள்',
    corporates: 'கார்ப்பரேட்கள்',
    blog: 'வலைப்பதிவு',
    pressReleases: 'ப்ரேஸ் ரிலிஜ்',
    reports: 'அறிக்கைகள்',
    privacyPolicy: 'தனியுரிமைக் கொள்கை',
    termsOfUse: 'பயன்பாட்டு விதிமுறைகள்',
    disclaimer: 'மறுப்பு',
    allRightsReserved: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை'
  },
  bn: {
    // Common
    dashboard: 'ড্যাশবোর্ড',
    workers: 'শ্রমিক',
    location: 'অবস্থান',
    analytics: 'বিশ্লেষণ',
    settings: 'সেটিংস',
    loading: 'লোড হচ্ছে...',
    totalWorkers: 'মোট শ্রমিক',
    activeWorkers: 'সক্রিয় শ্রমিক',
    changeLanguage: 'ভাষা সফলভাবে পরিবর্তন করা হয়েছে',
    
    // New Home Page
    heroBannerTitle: 'এক দেশ, এক পরিচয় - প্রতিটি অভিবাসী শ্রমিকের জন্য মিগি',
    heroBannerSubtitle: 'শ্রমিকদের চাকরির সাথে সংযোগ করা, সুরক্ষা নিশ্চিত করা এবং ভারত জুড়ে সমর্থন প্রদান করা',
    joinNow: 'এখনই যোগ দিন',
    postJob: 'চাকরি পোস্ট করুন',
    trackStatus: 'আমার অবস্থা ট্র্যাক করুন',
    
    selectYourRole: 'দ্রুত অ্যাক্সেস রোল সিলেক্টর',
    worker: 'শ্রমিক',
    employer: '঵্যবসায়/নিয়োগকর্তা',
    admin: 'অ্যাডমিন',
    workerDescription: 'কাছাকাছি কাজ খুঁজুন',
    employerDescription: 'যাচাই করা শ্রমিক নিয়োগ করুন',
    adminDescription: 'অঞ্চল ডেটা পর্যবেক্ষণ করুন',
    
    liveStatistics: 'লাইভ ড্যাশবোর্ড কাউন্টার',
    registeredWorkers: 'মোট নিবন্ধিত শ্রমিক',
    jobsPosted: 'ইস মাসে পোস্ট করা চাকরি',
    jobsFilled: 'পূরণ করা চাকরি',
    regionsCovered: 'কভার করা অঞ্চল',
    languagesSupported: 'সমর্থিত ভাষা',
    grievancesResolved: 'অভিযোগ সমাধান করা হয়েছে',
    
    searchTitle: 'স্মার্ট সার্চ',
    searchPlaceholder: 'চাকরি, শ্রমিক, বা স্ট্যাটাস চেক করতে অনুসন্ধান করুন...',
    search: 'অনুসন্ধান করুন',
    jobs: 'চাকরি',
    status: 'অবস্থা',
    filterLanguage: 'ভাষা',
    filterSkills: 'দক্ষতা',
    filterLocation: 'অবস্থান',
    filterExperience: 'অভিজ্ঞতা',
    
    keyFeatures: 'হাইলাইটেড বৈশিষ্ট্য',
    featureDigitalID: 'নিরাপদ ডিজিটাল আইডি',
    featureTracking: 'রিয়েল-টাইম ট্র্যাকিং',
    featureMultilingual: 'বহুভাষিক সমর্থন',
    featureMobile: 'মোবাইল-বান্ধব',
    featureGrievance: 'অভিযোগ সমাধান',
    featureDigitalIDDesc: 'QR কোড-ভিত্তিক পরিচয় যাচাইকরণ',
    featureTrackingDesc: 'GPS/IoT সক্ষম অবস্থান ট্র্যাকিং',
    featureMultilingualDesc: '12 ভারতীয় ভাষার জন্য সমর্থন',
    featureMobileDesc: 'যেকোন ডিভাইস থেকে যেখান থেকেই অ্যাক্সেস করুন',
    featureGrievanceDesc: 'অভিযোগের দ্রুত সমাধান',
    
    migrantServices: 'অভিবাসী পরিষেবা',
    serviceFindJobs: 'চাকরি খুঁজুন',
    serviceRegister: 'শ্রমিক হিসাবে নিবন্ধন করুন',
    serviceVerify: 'শ্রমিক আইডি যাচাই করুন',
    serviceLocate: 'সাহায্য কেন্দ্র খুঁজুন',
    serviceRights: 'আপনার অধিকার জানুন',
    serviceSupport: 'সহায়তা কেন্দ্র',
    serviceFindJobsDesc: 'লগইন প্রয়োজন',
    serviceRegisterDesc: 'দ্রুত সহজ প্রক্রিয়া',
    serviceVerifyDesc: 'নিয়োগকর্তাদের জন্য',
    serviceLocateDesc: 'নিকটতম সহায়তা',
    serviceRightsDesc: 'শ্রম আইন ব্যাখ্যা করা',
    serviceSupportDesc: '২৪/৭ সহায়তা',
    
    successStories: 'সাফল্যের গল্প',
    newsUpdates: 'সংবাদ ও আপডেট',
    readMore: 'সম্পূর্ণ গল্প পড়ুন',
    
    appPromoTitle: 'মিগি মোবাইল অ্যাপ পান',
    appPromoDesc: 'সমস্ত পরিষেবা অফলাইনে অ্যাক্সেস করুন, চাকরির সতর্কতা পান এবং আপনার আবেদনের স্থিতি ট্র্যাক করুন',
    androidApp: 'অ্যান্ড্রয়েড অ্যাপ',
    iOSApp: 'আইওএস অ্যাপ',
    scanQRCode: 'QR কোড স্ক্যান করুন',
    
    helpSupport: 'সাহায্য ও সমর্থন কেন্দ্র',
    frequentlyAsked: 'প্রায়শই জিজ্ঞাসিত প্রশ্ন',
    viewAllFAQs: 'সমস্ত FAQs দেখুন',
    contactUs: 'যোগাযোগ করুন',
    emergencyHelpline: 'জরুরি হেল্পলাইন',
    yourName: 'আপনার নাম',
    yourEmail: 'আপনার ইমেইল',
    yourQuery: 'আপনার প্রশ্ন',
    submit: 'জমা দিন',
    responseTime: 'আমরা সাধারণত 24 ঘণ্টার মধ্যে প্রতিস్পంদিস్তামు',
    
    aboutUs: 'আমাদের সম্পর্কে',
    partners: 'অংশীদার',
    resources: 'সম্পদ',
    legal: 'আইনী',
    ourMission: 'আমাদের লক্ষ্য',
    howItWorks: 'এটি কিভাবে কাজ করে',
    team: 'দল',
    governmentAgencies: 'সরকারি সংস্থা',
    NGOs: 'এনজিও',
    corporates: 'কর্পোরেট',
    blog: 'ব্লাগ',
    pressReleases: 'প্রেস রিলিজ',
    reports: 'প্রতিবেদন',
    privacyPolicy: 'গোপনীয়তা নীতি',
    termsOfUse: 'ব্যবহারের শর্তাবলী',
    disclaimer: 'দাবিত্যাগ',
    allRightsReserved: 'সর্বস্বত্ব সংরক্ষিত'
  },
  te: {
    // Common
    dashboard: 'డాష్‌బోర్డ్',
    workers: 'కార్మికులు',
    location: 'స్థానం',
    analytics: 'విశ్లేషణలు',
    settings: 'సెట్టింగ్‌లు',
    loading: 'లోడ్ అవుతోంది...',
    totalWorkers: 'మొత్తం కార్మికులు',
    activeWorkers: 'యాక్టివ్ కార్మికులు',
    changeLanguage: 'భాష విజయవంతంగా మార్చబడింది',
    
    // New Home Page
    heroBannerTitle: 'ఒక దేశం, ఒక గుర్తింపు - ప్రతి వలస కార్మికుడి కోసం మిగి',
    heroBannerSubtitle: 'కార్మికులను ఉద్యోగాలతో అనుసంధానించడం, భద్రతను నిర్ధారించడం మరియు భారతదేశం అంతటా మద్దతును అందించడం',
    joinNow: 'ఇప్పుడే చేరండి',
    postJob: 'ఉద్యోగం పోస్ట్ చేయండి',
    trackStatus: 'నా స్థితిని ట్రాక్ చేయండి',
    
    selectYourRole: 'త్వరిత యాక్సెస్ పాత్ర సెలెక్టర్',
    worker: 'కార్మికుడు',
    employer: 'వ్యాపారం/యజమాని',
    admin: 'అడ్మిన్',
    workerDescription: 'దగ్గరలో పని కనుగొనండి',
    employerDescription: 'ధృవీకరించబడిన కార్మికులను నియమించండి',
    adminDescription: 'ప్రాంత డేటాను పర్యవేక్షించండి',
    
    liveStatistics: 'లైవ్ డాష్‌బోర్డ్ కౌంటర్‌లు',
    registeredWorkers: 'మొత్తం నమోదిత కార్మికులు',
    jobsPosted: 'ఈ నెలలో పోస్ట్ చేయబడిన ఉద్యోగాలు',
    jobsFilled: 'నింపబడిన ఉద్యోగాలు',
    regionsCovered: 'కవర్ చేయబడిన ప్రాంతాలు',
    languagesSupported: 'మద్దతు ఉన్న భాషలు',
    grievancesResolved: 'పరిష్కరించబడిన ఫిర్యాదులు',
    
    searchTitle: 'స్మార్ట్ సెర్చ్',
    searchPlaceholder: 'ఉద్యోగాలు, కార్మికులు లేదా స్థితిని తనిఖీ చేయడానికి శోధించండి...',
    search: 'శోధించు',
    jobs: 'ఉద్యోగాలు',
    status: 'స్థితి',
    filterLanguage: 'భాష',
    filterSkills: 'నైపుణ్యాలు',
    filterLocation: 'స్థానం',
    filterExperience: 'అనుభవం',
    
    keyFeatures: 'ముఖ్య ఫీచర్లు',
    featureDigitalID: 'సురక్షిత డిజిటల్ ID',
    featureTracking: 'రియల్-టైమ్ ట్రాకింగ్',
    featureMultilingual: 'బహుభాషా మద్దతు',
    featureMobile: 'మొబైల్-ఫ్రెండ్లీ',
    featureGrievance: 'ఫిర్యాదు పరిష్కారం',
    featureDigitalIDDesc: 'QR కోడ్-ఆధారిత గుర్తింపు ధృవీకరణ',
    featureTrackingDesc: 'GPS/IoT ఆధారిత స్థాన ట్రాకింగ్',
    featureMultilingualDesc: '12 భారతీయ భాషలకు మద్దతు',
    featureMobileDesc: 'ఏ పరికరం నుండి ఎక్కడి నుండి అయినా యాక్సెస్ చేయండి',
    featureGrievanceDesc: 'ఫిర్యాదుల త్వరిత పరిష్కారం',
    
    migrantServices: 'వలస సేవలు',
    serviceFindJobs: 'ఉద్యోగాలను కనుగొనండి',
    serviceRegister: 'కార్మికుడిగా నమోదు చేయండి',
    serviceVerify: 'కార్మికుడి IDని ధృవీకరించండి',
    serviceLocate: 'సహాయ కేంద్రాన్ని కనుగొనండి',
    serviceRights: 'మీ హక్కులను తెలుసుకోండి',
    serviceSupport: 'మద్దతు కేంద్రం',
    serviceFindJobsDesc: 'లాగిన్ అవసరం',
    serviceRegisterDesc: 'త్వరిత సరళమైన ప్రక్రియ',
    serviceVerifyDesc: 'యజమానుల కోసం',
    serviceLocateDesc: 'సమీప సహాయం',
    serviceRightsDesc: 'కార్మిక చట్టాలు వివరించబడ్డాయి',
    serviceSupportDesc: '24/7 సహాయం',
    
    successStories: 'విజయ కథలు',
    newsUpdates: 'వార్తలు & నవీకరణలు',
    readMore: 'పూర్తి కథ చదవండి',
    
    appPromoTitle: 'మిగి మొబైల్ యాప్‌ను పొందండి',
    appPromoDesc: 'అన్ని సేవలను ఆఫ్‌లైన్‌లో యాక్సెస్ చేయండి, ఉద్యోగ హెచ్చరికలను పొందండి మరియు మీ దరఖాస్తు స్థితిని ట్రాక్ చేయండి',
    androidApp: 'ఆండ్రాయిడ్ యాప్',
    iOSApp: 'iOS యాప్',
    scanQRCode: 'QR కోడ్‌ను స్కాన్ చేయండి',
    
    helpSupport: 'సహాయం & మద్దతు కేంద్రం',
    frequentlyAsked: 'తరచుగా అడిగే ప్రశ్నలు',
    viewAllFAQs: 'అన్ని FAQలను చూడండి',
    contactUs: 'మమ్మల్ని సంప్రదించండి',
    emergencyHelpline: 'అత్యవసర హెల్ప్‌లైన్',
    yourName: 'మీ పేరు',
    yourEmail: 'మీ ఇమెయిల్',
    yourQuery: 'మీ ప్రశ్న',
    submit: 'సమర్పించు',
    responseTime: 'మేము సాధారణంగా 24 గంటల్లో ప్రతిస్పందిస్తాము',
    
    aboutUs: 'మా గురించి',
    partners: 'భాగస్వాములు',
    resources: 'వనరులు',
    legal: 'చట్టపరమైన',
    ourMission: 'మా మిషన్',
    howItWorks: 'ఇది ఎలా పనిచేస్తుంది',
    team: 'బృందం',
    governmentAgencies: 'ప్రభుత్వ సంస్థలు',
    NGOs: 'NGOలు',
    corporates: 'కార్పొరేట్లు',
    blog: 'బ్లాగ్',
    pressReleases: 'ప్రెస్ విడుదలలు',
    reports: 'నివేదికలు',
    privacyPolicy: 'గోప్యతా విధానం',
    termsOfUse: 'వినియోగ నిబంధనలు',
    disclaimer: 'నిరాకరణ',
    allRightsReserved: 'అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి'
  }
};

// Default language
const defaultLanguage = 'en';

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: () => '',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState(() => {
    // Try to get language from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    return savedLanguage || defaultLanguage;
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    const currentLanguage = language as keyof typeof translations;
    
    if (
      translations[currentLanguage] && 
      Object.prototype.hasOwnProperty.call(translations[currentLanguage], key)
    ) {
      return translations[currentLanguage][key as keyof (typeof translations)[typeof currentLanguage]];
    }
    
    // Fallback to English
    if (
      translations.en && 
      Object.prototype.hasOwnProperty.call(translations.en, key)
    ) {
      return translations.en[key as keyof typeof translations.en];
    }
    
    // If key doesn't exist, return the key itself
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
