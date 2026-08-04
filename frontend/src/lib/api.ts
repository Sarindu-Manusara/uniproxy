import type {
  AdminUser,
  Profile,
  ProxyPurchaseResponse,
  SupportFaq,
  SupportFaqInput,
  Transaction,
  UserProxy,
} from "./types";

const fallbackBaseUrl = "http://localhost:8080";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || fallbackBaseUrl;

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | number>;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = new URL(path, API_BASE_URL);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const headers: HeadersInit = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const payloadMessage =
      payload && typeof payload === "object"
        ? "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "detail" in payload && typeof payload.detail === "string"
            ? payload.detail
            : "error" in payload && typeof payload.error === "string"
              ? payload.error
              : ""
        : "";
    const message =
      typeof payload === "string" && payload.trim()
        ? payload
        : payloadMessage
          ? payloadMessage
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<string>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    }),

  register: (username: string, email: string, password: string) =>
    request<string>("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
    }),

  health: () => request<{ status: string }>("/api/health"),

  profile: (token: string) => request<Profile>("/api/user/profile", { token }),

  transactions: (token: string) =>
    request<Transaction[]>("/api/user/transactions", { token }),

  updatePassword: (token: string, oldPassword: string, newPassword: string) =>
    request<string>("/api/user/update-password", {
      method: "POST",
      token,
      body: { oldPassword, newPassword },
    }),

  proxies: (token: string) =>
    request<UserProxy[]>("/api/proxies/my-list", { token }),

  purchaseProxy: (token: string, body: unknown) =>
    request<ProxyPurchaseResponse>("/api/proxies/purchase", {
      method: "POST",
      token,
      body,
    }),

  providerAccount: (token: string) =>
    request<unknown>("/api/proxies/provider/account", { token }),

  providerStore: (token: string, proxyType?: string) =>
    request<unknown>("/api/proxies/provider/store", {
      token,
      query: proxyType ? { proxyType } : undefined,
    }),

  providerDatacenterCountries: (token: string) =>
    request<unknown>("/api/proxies/provider/datacenterp-countries", { token }),

  providerOrders: (token: string) =>
    request<unknown>("/api/proxies/provider/orders", { token }),

  providerCreateOrder: (token: string, body: unknown) =>
    request<unknown>("/api/proxies/provider/order", {
      method: "POST",
      token,
      body,
    }),

  providerOrder: (token: string, orderId: string) =>
    request<unknown>(`/api/proxies/provider/order/${encodeURIComponent(orderId)}`, {
      token,
    }),

  providerExtendOptions: (token: string, orderId: string) =>
    request<unknown>(
      `/api/proxies/provider/order/${encodeURIComponent(orderId)}/extend-options`,
      { token }
    ),

  providerExtendOrder: (token: string, orderId: string, body: unknown) =>
    request<unknown>(
      `/api/proxies/provider/order/${encodeURIComponent(orderId)}/extend`,
      {
        method: "POST",
        token,
        body,
      }
    ),

  providerAddWhitelistIp: (token: string, orderId: string, body: unknown) =>
    request<unknown>(
      `/api/proxies/provider/order/${encodeURIComponent(orderId)}/whitelist`,
      {
        method: "PATCH",
        token,
        body,
      }
    ),

  providerRemoveWhitelistIp: (token: string, orderId: string, body: unknown) =>
    request<unknown>(
      `/api/proxies/provider/order/${encodeURIComponent(orderId)}/whitelist`,
      {
        method: "DELETE",
        token,
        body,
      }
    ),

  providerWhitelistIps: (token: string, orderId: string) =>
    request<unknown>(
      `/api/proxies/provider/order/${encodeURIComponent(orderId)}/whitelist`,
      { token }
    ),

  providerUsageStats: (token: string, orderId: string) =>
    request<unknown>(
      `/api/proxies/provider/order/${encodeURIComponent(orderId)}/usage-stats`,
      { token }
    ),

  providerResetPassword: (token: string, orderId: string) =>
    request<unknown>(
      `/api/proxies/provider/order/${encodeURIComponent(orderId)}/reset-password`,
      {
        method: "POST",
        token,
      }
    ),

  supportFaqs: (token: string) =>
    request<SupportFaq[]>("/api/support/faqs", { token }),

  createPayment: (token: string, amount: string) =>
    request<string>("/api/payments/create", {
      method: "POST",
      token,
      query: { amount },
    }),

  createNowPaymentsAccount: (token: string) =>
    request<string>("/api/payments/create-account", {
      method: "POST",
      token,
    }),

  adminRevenue: (token: string) =>
    request<string>("/api/admin/revenue", { token }),

  adminUsers: (token: string) =>
    request<AdminUser[]>("/api/admin/users", { token }),

  adminFaqs: (token: string) =>
    request<SupportFaq[]>("/api/admin/faqs", { token }),

  adminCreateFaq: (token: string, body: SupportFaqInput) =>
    request<SupportFaq>("/api/admin/faqs", {
      method: "POST",
      token,
      body,
    }),

  adminUpdateFaq: (token: string, id: number, body: SupportFaqInput) =>
    request<SupportFaq>(`/api/admin/faqs/${id}`, {
      method: "PUT",
      token,
      body,
    }),

  adminDeleteFaq: (token: string, id: number) =>
    request<void>(`/api/admin/faqs/${id}`, {
      method: "DELETE",
      token,
    }),
};

export function formatCurrency(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
