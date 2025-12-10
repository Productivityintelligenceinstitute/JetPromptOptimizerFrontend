export const APP_ROUTES = {
  home: "/",
  features: "/#features",
  pricing: "/#pricing",
  resources: "/resources",
  getStarted: "/get-started",
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;
export type AppRoutePath = (typeof APP_ROUTES)[AppRouteKey];

export interface NavItem {
  key: AppRouteKey;
  label: string;
  href: AppRoutePath;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: APP_ROUTES.home },
  { key: "features", label: "Features", href: APP_ROUTES.features },
  { key: "pricing", label: "Pricing", href: APP_ROUTES.pricing },
  { key: "resources", label: "Resources", href: APP_ROUTES.resources },
];

export const CTA_NAV_ITEM: NavItem = {
  key: "getStarted",
  label: "Get Started",
  href: APP_ROUTES.getStarted,
};
