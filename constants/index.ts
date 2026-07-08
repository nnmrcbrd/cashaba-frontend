export const AUTH = {
  TOKEN_KEY: "casha_access_token",
  REFRESH_TOKEN_KEY: "casha_refresh_token",
  TOKEN_EXPIRY_MINUTES: 15,
};

export const ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  CHANGE_PASSWORD: "/change-password",
  ONBOARDING_ROLE: "/onboarding/role",
  ONBOARDING_INCOME: "/onboarding/income",
  DASHBOARD: "/dashboard",
  TRANSACTIONS: "/transactions",
  BUDGET: "/budget",
  ANALYTICS: "/analytics",
  AI_ASSISTANT: "/ai-assistant",
  SETTINGS: "/settings",
};

export const CATEGORIES = {
  EXPENSE: ["Food", "Transport", "Housing", "Utilities", "Shopping", "Health", "Entertainment", "Other"],
  INCOME: ["Salary", "Freelance", "Business", "Gift", "Other"],
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "🏠" },
  { label: "Transactions", href: ROUTES.TRANSACTIONS, icon: "💳" },
  { label: "Budget & Goals", href: ROUTES.BUDGET, icon: "🎯" },
  { label: "AI Assistant", href: ROUTES.AI_ASSISTANT, icon: "🤖" },
  { label: "Analytics", href: ROUTES.ANALYTICS, icon: "📊" },
  { label: "Settings", href: ROUTES.SETTINGS, icon: "⚙️" },
];