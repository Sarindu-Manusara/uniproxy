export type Profile = {
  username: string;
  email: string;
  balance: number | string;
  role: "USER" | "ADMIN" | string;
};

export type Transaction = {
  paymentId: string;
  amount: number | string;
  status: string;
  createdAt: string;
};

export type UserProxy = {
  id: number;
  ip: string;
  port: number;
  proxyUsername: string;
  proxyPassword: string;
  expiryDate: string;
  provider?: string | null;
  providerOrderId?: string | null;
  packageId?: string | null;
  packageName?: string | null;
  proxyType?: string | null;
  protocol?: string | null;
  providerStatus?: string | null;
};

export type ProxyPurchaseResponse = {
  message: string;
  provider: string;
  orderId?: string | null;
  chargedAmount: number | string;
  savedProxies: number;
  orderPayload?: unknown;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  balance: number | string;
  role: string;
  nowPaymentsUserId?: string | null;
};

export type SupportFaq = {
  id: number;
  question: string;
  answer: string;
  active: boolean;
  sortOrder: number;
};

export type SupportFaqInput = {
  question: string;
  answer: string;
  active: boolean;
  sortOrder: number;
};

export type ViewId =
  | "dashboard"
  | "support"
  | "proxies"
  | "active-plans"
  | "purchase-plans"
  | "payments"
  | "transactions"
  | "settings"
  | "admin";
