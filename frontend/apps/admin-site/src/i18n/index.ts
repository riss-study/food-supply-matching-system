import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import common from "./locales/ko/common.json"
import auth from "./locales/ko/auth.json"
import reviews from "./locales/ko/reviews.json"
import notices from "./locales/ko/notices.json"
import stats from "./locales/ko/stats.json"
import members from "./locales/ko/members.json"
import app from "./locales/ko/app.json"

export const resources = {
  ko: {
    common,
    auth,
    reviews,
    notices,
    stats,
    members,
    app,
  },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: "ko",
  fallbackLng: "ko",
  defaultNS: "common",
  ns: ["common", "auth", "reviews", "notices", "stats", "members", "app"],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
