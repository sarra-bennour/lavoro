import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

i18n
  .use(Backend) // Use the HTTP backend for loading translations
  .use(initReactI18next) // Initialize i18next for React
  .init({
    lng: "en", // Default language
    fallbackLng: "en", // Fallback language
    backend: {
      loadPath: "https://libretranslate.com/translate", // LibreTranslate API endpoint
      parse: (data) => {
        const parsedData = JSON.parse(data);
        return parsedData.translatedText; // Extract translated text from the response
      },
      request: (_options, url, payload = {}, callback) => {
        const { q, source, target } = payload;
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q,
            source,
            target,
          }),
        })
          .then((response) => response.json())
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      },
    },
  });

export default i18n;