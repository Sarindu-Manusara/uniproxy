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
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  balance: number | string;
  role: string;
  nowPaymentsUserId?: string | null;
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
