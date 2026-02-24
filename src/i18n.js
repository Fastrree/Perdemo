import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// TR translations
import commonTR from './locales/tr/common.json'
import dashboardTR from './locales/tr/dashboard.json'
import productsTR from './locales/tr/products.json'
import ordersTR from './locales/tr/orders.json'
import customersTR from './locales/tr/customers.json'
import demoTR from './locales/tr/demo.json'
import quoteTR from './locales/tr/quote.json'
import measureTR from './locales/tr/measure.json'
import moodboardTR from './locales/tr/moodboard.json'
import inventoryTR from './locales/tr/inventory.json'
import analyticsTR from './locales/tr/analytics.json'
import whitelabelTR from './locales/tr/whitelabel.json'
import landingTR from './locales/tr/landing.json'

// EN translations
import commonEN from './locales/en/common.json'
import dashboardEN from './locales/en/dashboard.json'
import productsEN from './locales/en/products.json'
import ordersEN from './locales/en/orders.json'
import customersEN from './locales/en/customers.json'
import demoEN from './locales/en/demo.json'
import quoteEN from './locales/en/quote.json'
import measureEN from './locales/en/measure.json'
import moodboardEN from './locales/en/moodboard.json'
import inventoryEN from './locales/en/inventory.json'
import analyticsEN from './locales/en/analytics.json'
import whitelabelEN from './locales/en/whitelabel.json'
import landingEN from './locales/en/landing.json'

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            tr: {
                common: commonTR,
                dashboard: dashboardTR,
                products: productsTR,
                orders: ordersTR,
                customers: customersTR,
                demo: demoTR,
                quote: quoteTR,
                measure: measureTR,
                moodboard: moodboardTR,
                inventory: inventoryTR,
                analytics: analyticsTR,
                whitelabel: whitelabelTR,
                landing: landingTR,
            },
            en: {
                common: commonEN,
                dashboard: dashboardEN,
                products: productsEN,
                orders: ordersEN,
                customers: customersEN,
                demo: demoEN,
                quote: quoteEN,
                measure: measureEN,
                moodboard: moodboardEN,
                inventory: inventoryEN,
                analytics: analyticsEN,
                whitelabel: whitelabelEN,
                landing: landingEN,
            },
        },
        fallbackLng: 'tr',
        defaultNS: 'common',
        ns: ['common', 'dashboard', 'products', 'orders', 'customers', 'demo', 'quote', 'measure', 'moodboard', 'inventory', 'analytics', 'whitelabel', 'landing'],
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'perdemo-lang',
        },
        interpolation: {
            escapeValue: false, // React zaten XSS'e karşı korumalı
        },
    })

export default i18n
