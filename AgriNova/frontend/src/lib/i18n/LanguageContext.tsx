"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "hi" | "mr" | "kn";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "en", setLang: () => {}, t: (k) => k,
});

export const useLang = () => useContext(LangContext);

// Translations dictionary
const dict: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड", kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" },
  "nav.soilAnalysis": { en: "Soil Analysis", hi: "मिट्टी विश्लेषण", mr: "माती विश्लेषण", kn: "ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ" },
  "nav.history": { en: "History", hi: "इतिहास", mr: "इतिहास", kn: "ಇತಿಹಾಸ" },
  "nav.grievances": { en: "Grievances", hi: "शिकायतें", mr: "तक्रारी", kn: "ದೂರುಗಳು" },
  "nav.userMgmt": { en: "User Management", hi: "उपयोगकर्ता प्रबंधन", mr: "वापरकर्ता व्यवस्थापन", kn: "ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ" },
  "nav.broadcast": { en: "Broadcast Center", hi: "प्रसारण केंद्र", mr: "प्रसारण केंद्र", kn: "ಪ್ರಸಾರ ಕೇಂದ್ರ" },

  // Greetings
  "greet.morning": { en: "Good Morning", hi: "शुभ प्रभात", mr: "शुभ सकाळ", kn: "ಶುಭೋದಯ" },
  "greet.afternoon": { en: "Good Afternoon", hi: "शुभ दोपहर", mr: "शुभ दुपार", kn: "ಶುಭ ಮಧ್ಯಾಹ್ನ" },
  "greet.evening": { en: "Good Evening", hi: "शुभ संध्या", mr: "शुभ संध्याकाळ", kn: "ಶುಭ ಸಂಜೆ" },

  // Dashboard
  "dash.label": { en: "THE DIGITAL AGRONOMIST", hi: "डिजिटल कृषि विशेषज्ञ", mr: "डिजिटल कृषी तज्ञ", kn: "ಡಿಜಿಟಲ್ ಕೃಷಿ ತಜ್ಞ" },
  "dash.startAnalysis": { en: "Start New Soil Analysis", hi: "नई मिट्टी विश्लेषण शुरू करें", mr: "नवीन माती विश्लेषण सुरू करा", kn: "ಹೊಸ ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ ಪ್ರಾರಂಭಿಸಿ" },
  "dash.latestRec": { en: "Latest Recommendation", hi: "नवीनतम अनुशंसा", mr: "नवीनतम शिफारस", kn: "ಇತ್ತೀಚಿನ ಶಿಫಾರಸು" },
  "dash.activeCrop": { en: "Active Crop", hi: "सक्रिय फसल", mr: "सक्रिय पीक", kn: "ಸಕ್ರಿಯ ಬೆಳೆ" },
  "dash.farmArea": { en: "Total Farm Area", hi: "कुल खेत क्षेत्र", mr: "एकूण शेत क्षेत्र", kn: "ಒಟ್ಟು ಜಮೀನು ಪ್ರದೇಶ" },
  "dash.soilTrends": { en: "Soil Health Trends", hi: "मिट्टी स्वास्थ्य रुझान", mr: "माती आरोग्य कल", kn: "ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಪ್ರವೃತ್ತಿ" },
  "dash.phBalance": { en: "pH Balance", hi: "पीएच संतुलन", mr: "पीएच संतुलन", kn: "pH ಸಮತೋಲನ" },
  "dash.systemHealth": { en: "System Health", hi: "प्रणाली स्वास्थ्य", mr: "प्रणाली आरोग्य", kn: "ವ್ಯವಸ್ಥೆ ಆರೋಗ್ಯ" },
  "dash.recentReports": { en: "Recent Soil Reports", hi: "हालिया मिट्टी रिपोर्ट", mr: "अलीकडील माती अहवाल", kn: "ಇತ್ತೀಚಿನ ಮಣ್ಣಿನ ವರದಿಗಳು" },
  "dash.viewAll": { en: "View All Records", hi: "सभी रिकॉर्ड देखें", mr: "सर्व नोंदी पहा", kn: "ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ" },
  "dash.noAnalysis": { en: "No soil analyses found.", hi: "कोई मिट्टी विश्लेषण नहीं मिला।", mr: "कोणतेही माती विश्लेषण सापडले नाही.", kn: "ಯಾವುದೇ ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ ಕಂಡುಬಂದಿಲ್ಲ." },
  "dash.runFirst": { en: "Run First Analysis", hi: "पहला विश्लेषण करें", mr: "पहिले विश्लेषण करा", kn: "ಮೊದಲ ವಿಶ್ಲೇಷಣೆ ನಡೆಸಿ" },
  "dash.fullReport": { en: "Full Report", hi: "पूरी रिपोर्ट", mr: "संपूर्ण अहवाल", kn: "ಪೂರ್ಣ ವರದಿ" },
  "dash.acres": { en: "Acres", hi: "एकड़", mr: "एकर", kn: "ಎಕರೆ" },
  "dash.days": { en: "Days", hi: "दिन", mr: "दिवस", kn: "ದಿನಗಳು" },
  "dash.edit": { en: "(Edit)", hi: "(संपादित करें)", mr: "(संपादित करा)", kn: "(ಸಂಪಾದಿಸಿ)" },
  "dash.local": { en: "Local", hi: "स्थानीय", mr: "स्थानिक", kn: "ಸ್ಥಳೀಯ" },
  "dash.near": { en: "Near", hi: "निकट", mr: "जवळ", kn: "ಹತ್ತಿರ" },
  "dash.current": { en: "Current", hi: "वर्तमान", mr: "सध्याचे", kn: "ಪ್ರಸ್ತುತ" },
  "dash.score": { en: "Score", hi: "स्कोर", mr: "गुण", kn: "ಅಂಕ" },
  "dash.stableRange": { en: "Stable within target range.", hi: "लक्ष्य सीमा में स्थिर।", mr: "लक्ष्य श्रेणीत स्थिर.", kn: "ಗುರಿ ಶ್ರೇಣಿಯಲ್ಲಿ ಸ್ಥಿರ." },
  "dash.aggScore": { en: "Aggregated agronomic potential score.", hi: "समग्र कृषि क्षमता स्कोर।", mr: "एकत्रित कृषी क्षमता गुण.", kn: "ಒಟ್ಟು ಕೃಷಿ ಸಾಮರ್ಥ್ಯ ಅಂಕ." },

  // Login
  "login.welcome": { en: "Welcome Back", hi: "वापसी पर स्वागत है", mr: "पुन्हा स्वागत", kn: "ಮರಳಿ ಸ್ವಾಗತ" },
  "login.subtitle": { en: "Access your digital agronomist dashboard.", hi: "अपने डिजिटल कृषि डैशबोर्ड तक पहुँचें।", mr: "तुमच्या डिजिटल कृषी डॅशबोर्डवर प्रवेश करा.", kn: "ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಕೃಷಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಿ." },
  "login.mobileOrEmail": { en: "Mobile Number or Email", hi: "मोबाइल नंबर या ईमेल", mr: "मोबाईल नंबर किंवा ईमेल", kn: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್" },
  "login.password": { en: "Password", hi: "पासवर्ड", mr: "पासवर्ड", kn: "ಪಾಸ್ವರ್ಡ್" },
  "login.forgot": { en: "Forgot Password?", hi: "पासवर्ड भूल गए?", mr: "पासवर्ड विसरलात?", kn: "ಪಾಸ್ವರ್ಡ್ ಮರೆತಿರಾ?" },
  "login.remember": { en: "Remember me", hi: "मुझे याद रखें", mr: "मला लक्षात ठेवा", kn: "ನನ್ನನ್ನು ನೆನಪಿಡಿ" },
  "login.signIn": { en: "Sign In to Dashboard", hi: "डैशबोर्ड में प्रवेश करें", mr: "डॅशबोर्डवर साइन इन करा", kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ" },
  "login.verifying": { en: "Verifying...", hi: "सत्यापित हो रहा...", mr: "सत्यापन सुरू...", kn: "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..." },
  "login.noAccount": { en: "Don't have an account?", hi: "खाता नहीं है?", mr: "खाते नाही?", kn: "ಖಾತೆ ಇಲ್ಲವೇ?" },
  "login.register": { en: "Register Here", hi: "यहाँ पंजीकरण करें", mr: "येथे नोंदणी करा", kn: "ಇಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿ" },
  "login.secure": { en: "Secure Entry Protocol", hi: "सुरक्षित प्रवेश प्रोटोकॉल", mr: "सुरक्षित प्रवेश प्रोटोकॉल", kn: "ಸುರಕ್ಷಿತ ಪ್ರವೇಶ ಪ್ರೋಟೋಕಾಲ್" },
  "login.secureDesc": { en: "Your data is encrypted using military-grade AES-256 protocols to ensure harvest integrity.", hi: "आपका डेटा सैन्य-ग्रेड AES-256 प्रोटोकॉल से एन्क्रिप्ट किया गया है।", mr: "तुमचा डेटा लष्करी-दर्जाच्या AES-256 प्रोटोकॉलने एन्क्रिप्ट केलेला आहे.", kn: "ನಿಮ್ಮ ಡೇಟಾ ಮಿಲಿಟರಿ-ಗ್ರೇಡ್ AES-256 ಪ್ರೋಟೋಕಾಲ್‌ಗಳಿಂದ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಆಗಿದೆ." },
  "login.heroTitle1": { en: "The Future of", hi: "भविष्य है", mr: "भविष्य आहे", kn: "ಭವಿಷ್ಯ" },
  "login.heroTitle2": { en: "Agronomy", hi: "कृषि विज्ञान", mr: "कृषी विज्ञान", kn: "ಕೃಷಿ ವಿಜ್ಞಾನ" },
  "login.heroTitle3": { en: "Digital.", hi: "डिजिटल।", mr: "डिजिटल.", kn: "ಡಿಜಿಟಲ್." },
  "login.heroDesc": { en: "Precision data meet premium insights. Log in to manage your yields with scientific accuracy.", hi: "सटीक डेटा प्रीमियम अंतर्दृष्टि से मिलता है। वैज्ञानिक सटीकता के साथ अपनी उपज प्रबंधित करें।", mr: "अचूक डेटा प्रीमियम अंतर्दृष्टीशी भेटतो. वैज्ञानिक अचूकतेने उत्पादन व्यवस्थापित करा.", kn: "ನಿಖರ ಡೇಟಾ ಪ್ರೀಮಿಯಂ ಒಳನೋಟಗಳನ್ನು ಭೇಟಿ ಮಾಡುತ್ತದೆ." },

  // Soil Analysis
  "soil.title": { en: "New Soil Analysis", hi: "नई मिट्टी विश्लेषण", mr: "नवीन माती विश्लेषण", kn: "ಹೊಸ ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ" },
  "soil.label": { en: "SOIL PARAMETER INPUT", hi: "मिट्टी पैरामीटर इनपुट", mr: "माती पॅरामीटर इनपुट", kn: "ಮಣ್ಣಿನ ನಿಯತಾಂಕ ಇನ್‌ಪುಟ್" },
  "soil.subtitle": { en: "Enter the 7 sensor readings from your soil test. Weather data will be auto-fetched from your registered GPS coordinates.", hi: "अपने मिट्टी परीक्षण से 7 सेंसर रीडिंग दर्ज करें।", mr: "तुमच्या माती चाचणीतील 7 सेन्सर रीडिंग प्रविष्ट करा.", kn: "ನಿಮ್ಮ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆಯ 7 ಸೆನ್ಸರ್ ರೀಡಿಂಗ್‌ಗಳನ್ನು ನಮೂದಿಸಿ." },
  "soil.sensorReadings": { en: "Sensor Readings", hi: "सेंसर रीडिंग", mr: "सेन्सर रीडिंग", kn: "ಸೆನ್ಸರ್ ರೀಡಿಂಗ್" },
  "soil.additionalInfo": { en: "Additional Information", hi: "अतिरिक्त जानकारी", mr: "अतिरिक्त माहिती", kn: "ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ" },
  "soil.previousCrop": { en: "Previous Crop Grown", hi: "पिछली फसल", mr: "मागील पीक", kn: "ಹಿಂದಿನ ಬೆಳೆ" },
  "soil.cropPlanted": { en: "Crop Already Planted?", hi: "फसल पहले से लगाई?", mr: "पीक आधीच लावले?", kn: "ಬೆಳೆ ಈಗಾಗಲೇ ನೆಟ್ಟಿದೆಯೇ?" },
  "soil.yes": { en: "Yes", hi: "हाँ", mr: "होय", kn: "ಹೌದು" },
  "soil.no": { en: "No", hi: "नहीं", mr: "नाही", kn: "ಇಲ್ಲ" },
  "soil.plantedCrop": { en: "Planted Crop Name", hi: "लगाई गई फसल", mr: "लावलेले पीक", kn: "ನೆಟ್ಟ ಬೆಳೆ" },
  "soil.plantingDate": { en: "Planting Date", hi: "रोपण तिथि", mr: "लागवड तारीख", kn: "ನಾಟಿ ದಿನಾಂಕ" },
  "soil.analyze": { en: "Analyze Soil & Get Recommendation", hi: "मिट्टी का विश्लेषण करें और अनुशंसा प्राप्त करें", mr: "मातीचे विश्लेषण करा आणि शिफारस मिळवा", kn: "ಮಣ್ಣನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ಶಿಫಾರಸು ಪಡೆಯಿರಿ" },
  "soil.analyzing": { en: "Analyzing...", hi: "विश्लेषण हो रहा...", mr: "विश्लेषण सुरू...", kn: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..." },
  "soil.cancel": { en: "Cancel", hi: "रद्द करें", mr: "रद्द करा", kn: "ರದ್ದುಮಾಡಿ" },
  "soil.weatherNote": { en: "Weather data (air temperature, humidity, rainfall) will be automatically fetched from your registered GPS coordinates. Season is determined from the current date.", hi: "मौसम डेटा स्वचालित रूप से आपके GPS से प्राप्त होगा।", mr: "हवामान डेटा आपोआप तुमच्या GPS वरून मिळवला जाईल.", kn: "ಹವಾಮಾನ ಡೇಟಾ ನಿಮ್ಮ GPS ಯಿಂದ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪಡೆಯಲಾಗುತ್ತದೆ." },

  // History
  "hist.title": { en: "Soil Reading History", hi: "मिट्टी रीडिंग इतिहास", mr: "माती रीडिंग इतिहास", kn: "ಮಣ್ಣಿನ ಓದುವ ಇತಿಹಾಸ" },
  "hist.label": { en: "ANALYSIS ARCHIVE", hi: "विश्लेषण अभिलेखागार", mr: "विश्लेषण संग्रहालय", kn: "ವಿಶ್ಲೇಷಣೆ ಆರ್ಕೈವ್" },
  "hist.subtitle": { en: "Detailed archiving of every analysis logged to your farm.", hi: "आपके खेत में प्रत्येक विश्लेषण का विस्तृत संग्रह।", mr: "तुमच्या शेतावर प्रत्येक विश्लेषणाचे तपशीलवार संग्रहण.", kn: "ನಿಮ್ಮ ಜಮೀನಿಗೆ ಲಾಗ್ ಮಾಡಿದ ಪ್ರತಿ ವಿಶ್ಲೇಷಣೆಯ ವಿವರವಾದ ಆರ್ಕೈವಿಂಗ್." },
  "hist.search": { en: "Search by crop name...", hi: "फसल के नाम से खोजें...", mr: "पिकाच्या नावाने शोधा...", kn: "ಬೆಳೆ ಹೆಸರಿನ ಮೂಲಕ ಹುಡುಕಿ..." },
  "hist.date": { en: "Date", hi: "तिथि", mr: "तारीख", kn: "ದಿನಾಂಕ" },
  "hist.cropContext": { en: "Crop Context", hi: "फसल संदर्भ", mr: "पीक संदर्भ", kn: "ಬೆಳೆ ಸಂದರ್ಭ" },
  "hist.recommendation": { en: "Recommendation", hi: "अनुशंसा", mr: "शिफारस", kn: "ಶಿಫಾರಸು" },
  "hist.actions": { en: "Actions", hi: "कार्य", mr: "कृती", kn: "ಕ್ರಿಯೆಗಳು" },
  "hist.viewReport": { en: "View Full Report", hi: "पूरी रिपोर्ट देखें", mr: "संपूर्ण अहवाल पहा", kn: "ಪೂರ್ಣ ವರದಿ ವೀಕ್ಷಿಸಿ" },
  "hist.delete": { en: "Delete", hi: "हटाएं", mr: "हटवा", kn: "ಅಳಿಸಿ" },
  "hist.noRecords": { en: "No records found.", hi: "कोई रिकॉर्ड नहीं मिला।", mr: "कोणत्याही नोंदी सापडल्या नाहीत.", kn: "ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ." },

  // Notifications
  "notif.title": { en: "Recent Alerts", hi: "हाल की सूचनाएं", mr: "अलीकडील सूचना", kn: "ಇತ್ತೀಚಿನ ಎಚ್ಚರಿಕೆಗಳು" },
  "notif.empty": { en: "No system messages at the moment.", hi: "अभी कोई संदेश नहीं।", mr: "सध्या कोणतेही संदेश नाहीत.", kn: "ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಂದೇಶಗಳಿಲ್ಲ." },

  // Language selector
  "lang.select": { en: "Language", hi: "भाषा", mr: "भाषा", kn: "ಭಾಷೆ" },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("agrinova-lang") as Lang;
    if (saved && ["en", "hi", "mr", "kn"].includes(saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("agrinova-lang", l);
  };

  const t = (key: string): string => {
    return dict[key]?.[lang] || dict[key]?.["en"] || key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
