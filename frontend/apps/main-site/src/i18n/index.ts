import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import common from "./locales/ko/common.json"
import auth from "./locales/ko/auth.json"
import requestManagement from "./locales/ko/request-management.json"
import threads from "./locales/ko/threads.json"
import supplierProfile from "./locales/ko/supplier-profile.json"
import notices from "./locales/ko/notices.json"
import discovery from "./locales/ko/discovery.json"
import quotes from "./locales/ko/quotes.json"
import supplierRequests from "./locales/ko/supplier-requests.json"
import supplierQuotes from "./locales/ko/supplier-quotes.json"
import businessProfile from "./locales/ko/business-profile.json"
import app from "./locales/ko/app.json"

export const resources = {
  ko: {
    common,
    auth,
    "request-management": requestManagement,
    threads,
    "supplier-profile": supplierProfile,
    notices,
    discovery,
    quotes,
    "supplier-requests": supplierRequests,
    "supplier-quotes": supplierQuotes,
    "business-profile": businessProfile,
    app,
  },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: "ko",
  fallbackLng: "ko",
  defaultNS: "common",
  ns: [
    "common",
    "auth",
    "request-management",
    "threads",
    "supplier-profile",
    "notices",
    "discovery",
    "quotes",
    "supplier-requests",
    "supplier-quotes",
    "business-profile",
    "app",
  ],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
