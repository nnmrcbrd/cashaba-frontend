export const AUTH = {
  TOKEN_KEY: "casha_access_token",
  REFRESH_TOKEN_KEY: "casha_refresh_token",
  TOKEN_EXPIRY_MINUTES: 15,
};

export const ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  CHANGE_PASSWORD: "/change-password",
  ONBOARDING_ROLE: "/onboarding/role",
  ONBOARDING_INCOME: "/onboarding/income",
  ONBOARDING_RECURRING: "/onboarding/recurring",
  ONBOARDING_BUDGET: "/onboarding/budget",
  DASHBOARD: "/dashboard",
  TRANSACTIONS: "/transactions",
  ACCOUNTS: "/accounts",
  BUDGET: "/budget",
  LOANS: "/obligations",
  ANALYTICS: "/analytics",
  AI_ASSISTANT: "/ai-assistant",
  SETTINGS: "/settings",
  SUBSCRIPTION: "/subscription",
  ADMIN_MANAGE_USERS: "/admin/manage-users",
  ADMIN_ACTIVITY_LOGS: "/admin/activity-logs",
};

export const CATEGORIES = {
  EXPENSE: [
    "Food & Dining",
    "Transport",
    "Utilities",
    "Housing",
    "Health",
    "Entertainment",
    "Education",
    "Shopping",
    "Savings",
    "Debt Payment",
    "Others",
  ],
  INCOME: ["Salary", "Freelance", "Business", "Gift", "Other"],
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Wallet & Accounts", href: ROUTES.ACCOUNTS },
  { label: "Transaction History", href: ROUTES.TRANSACTIONS },
  { label: "Budget & Goals", href: ROUTES.BUDGET },
  { label: "Debts & Loans", href: ROUTES.LOANS },
  { label: "AI Assistant", href: ROUTES.AI_ASSISTANT },
  { label: "Financial Review", href: ROUTES.ANALYTICS },
  { label: "Settings", href: ROUTES.SETTINGS },
];

export const NAV_GROUPS = [
  {
    id: "money",
    label: "Money",
    items: [
      { label: "Wallet & Accounts", href: ROUTES.ACCOUNTS },
      { label: "Transaction History", href: ROUTES.TRANSACTIONS },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    items: [
      { label: "Budget & Goals", href: ROUTES.BUDGET },
      { label: "Obligations & Debts", href: ROUTES.LOANS },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { label: "Financial Review", href: ROUTES.ANALYTICS },
      { label: "AI Assistant", href: ROUTES.AI_ASSISTANT },
    ],
  },
] as const;
