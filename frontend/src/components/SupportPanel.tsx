"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Code2,
  Database,
  KeyRound,
  ListOrdered,
  PackageSearch,
  ShieldCheck,
  Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";

type EndpointDoc = {
  method: string;
  path: string;
  description: string;
  request: string;
  response: string;
};

type SupportPanelProps = {
  token: string;
};

type ExplorerAction =
  | "account"
  | "store"
  | "servers"
  | "datacenterCountries"
  | "orders"
  | "createOrder"
  | "orderDetails"
  | "extendOptions"
  | "extendOrder"
  | "whitelistList"
  | "whitelistAdd"
  | "whitelistRemove"
  | "usageStats"
  | "resetPassword"
  | "orderProxies"
  | "unlimitedMetrics"
  | "gresiTargeting"
  | "mobileCountries"
  | "mobileRegions"
  | "mobileCities"
  | "mobileIsps";

const json = (value: unknown) => JSON.stringify(value, null, 2);

const examples: Record<string, Pick<EndpointDoc, "request" | "response">> = {
  account: {
    request: "GET /api/proxies/provider/account",
    response: json({
      balance: 125.5,
      currency: "USD",
      reseller: true,
      rateLimits: {
        requestsPerHour: 1000,
        requestsUsed: 47,
        requestsRemaining: 953,
        resetAt: "2026-05-28T15:00:00.000Z",
      },
    }),
  },
  store: {
    request: "GET /api/proxies/provider/store?proxyType=gResidential",
    response: json([
      {
        id: "pkg_resi_10gb",
        name: "Residential 10GB",
        proxyType: "Residential",
        resellerPrice: 25,
        bandwidthGb: 10,
        locations: [{ id: 1, country: "United States", code: "US" }],
      },
    ]),
  },
  servers: {
    request: "GET /api/proxies/provider/servers",
    response: json([
      { id: 1, hostname: "gw-us.unlimited.example", country: "US" },
      { id: 2, hostname: "gw-eu.unlimited.example", country: "DE" },
    ]),
  },
  datacenterCountries: {
    request: "GET /api/proxies/provider/datacenterp-countries",
    response: json([
      { id: 1, name: "United States", code: "US", available: true },
      { id: 44, name: "Germany", code: "DE", available: true },
    ]),
  },
  orders: {
    request: "GET /api/proxies/provider/orders",
    response: json([
      {
        id: "ord_12345",
        packageName: "Residential 10GB",
        status: "active",
        expiresAt: "2026-06-28T12:00:00.000Z",
      },
    ]),
  },
  createOrder: {
    request: `POST /api/proxies/provider/order
Content-Type: application/json

${json({
  packageId: "pkg_isp_30d",
  ispData: {
    quantity: 5,
    countryId: 1,
  },
})}`,
    response: json({
      id: "ord_67890",
      status: "active",
      total: 35,
      package_ips: 5,
    }),
  },
  orderDetails: {
    request: "GET /api/proxies/provider/order/ord_67890",
    response: json({
      id: "ord_67890",
      status: "active",
      credentials: [
        {
          host: "proxy.example.com",
          port: 9000,
          username: "user-session",
          password: "pass",
        },
      ],
    }),
  },
  extendOptions: {
    request: "GET /api/proxies/provider/order/ord_67890/extend-options",
    response: json([
      { packageId: "pkg_extend_10gb", extendType: "bandwidth", price: 25 },
      { packageId: "pkg_extend_30d", extendType: "days", price: 35 },
    ]),
  },
  extendOrder: {
    request: `POST /api/proxies/provider/order/ord_67890/extend
Content-Type: application/json

${json({ packageId: "pkg_extend_10gb" })}`,
    response: json({ id: "ord_67890", status: "extended", expiresAt: "2026-07-28T12:00:00.000Z" }),
  },
  whitelistAdd: {
    request: `PATCH /api/proxies/provider/order/ord_67890/whitelist
Content-Type: application/json

${json({ ip: "203.0.113.10" })}`,
    response: json({ status: "success", whitelist: ["203.0.113.10"] }),
  },
  whitelistRemove: {
    request: `DELETE /api/proxies/provider/order/ord_67890/whitelist
Content-Type: application/json

${json({ ip: "203.0.113.10" })}`,
    response: json({ status: "success", whitelist: [] }),
  },
  whitelistList: {
    request: "GET /api/proxies/provider/order/ord_67890/whitelist",
    response: json({ whitelist: ["203.0.113.10"] }),
  },
  usageStats: {
    request: "GET /api/proxies/provider/order/ord_67890/usage-stats",
    response: json({ requests: 12500, bandwidthGb: 8.4, successRate: 99.1 }),
  },
  resetPassword: {
    request: "POST /api/proxies/provider/order/ord_67890/reset-password",
    response: json({ status: "success", password: "new-password" }),
  },
  orderProxies: {
    request: "GET /api/proxies/provider/order/ord_67890/proxies",
    response: json([
      { host: "203.0.113.25", port: 1338, login: "line-user", password: "line-pass" },
    ]),
  },
  unlimitedMetrics: {
    request: "GET /api/proxies/provider/order/ord_67890/unlimited-metrics?view=overview",
    response: json({ metrics: { bandwidth: { used: 1245000 } }, available: true }),
  },
  gresiTargeting: {
    request: "GET /api/proxies/provider/targeting/gresi",
    response: json({
      countries: [{ id: 1, name: "United States", code: "US" }],
      regions: [{ id: 12, name: "California", countryId: 1 }],
      cities: [{ id: 99, name: "Los Angeles", regionId: 12 }],
    }),
  },
  mobileCountries: {
    request: "GET /api/proxies/provider/targeting/mobile/countries",
    response: json([{ id: 1, name: "United States", code: "US" }]),
  },
  mobileRegions: {
    request: "GET /api/proxies/provider/targeting/mobile/regions?countryId=1",
    response: json([{ id: 12, name: "California", countryId: 1 }]),
  },
  mobileCities: {
    request: "GET /api/proxies/provider/targeting/mobile/cities?countryId=1&regionId=12",
    response: json([{ id: 99, name: "Los Angeles", regionId: 12 }]),
  },
  mobileIsps: {
    request: "GET /api/proxies/provider/targeting/mobile/isps?countryId=1&regionId=12&cityId=99",
    response: json([{ id: 7, name: "T-Mobile", cityId: 99 }]),
  },
};

const endpointGroups = [
  {
    title: "Account",
    icon: KeyRound,
    endpoints: [
      {
        method: "GET",
        path: "/api/proxies/provider/account",
        description: "Account info and rate limits",
        ...examples.account,
      },
    ],
  },
  {
    title: "Store & Products",
    icon: PackageSearch,
    endpoints: [
      {
        method: "GET",
        path: "/api/proxies/provider/store",
        description: "List available proxy products",
        ...examples.store,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/servers",
        description: "Unlimited Residential gateway servers",
        ...examples.servers,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/datacenterp-countries",
        description: "DatacenterP availability",
        ...examples.datacenterCountries,
      },
    ],
  },
  {
    title: "Orders",
    icon: ListOrdered,
    endpoints: [
      {
        method: "GET",
        path: "/api/proxies/provider/orders",
        description: "List reseller orders",
        ...examples.orders,
      },
      {
        method: "POST",
        path: "/api/proxies/provider/order",
        description: "Purchase a proxy package",
        ...examples.createOrder,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/order/{orderId}",
        description: "Order details and credentials",
        ...examples.orderDetails,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/order/{orderId}/extend-options",
        description: "Extension packages",
        ...examples.extendOptions,
      },
      {
        method: "POST",
        path: "/api/proxies/provider/order/{orderId}/extend",
        description: "Extend an order",
        ...examples.extendOrder,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/order/{orderId}/whitelist",
        description: "List whitelisted IPs",
        ...examples.whitelistList,
      },
      {
        method: "PATCH",
        path: "/api/proxies/provider/order/{orderId}/whitelist",
        description: "Add whitelisted IP",
        ...examples.whitelistAdd,
      },
      {
        method: "DELETE",
        path: "/api/proxies/provider/order/{orderId}/whitelist",
        description: "Remove whitelisted IP",
        ...examples.whitelistRemove,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/order/{orderId}/usage-stats",
        description: "Standard Residential usage analytics",
        ...examples.usageStats,
      },
      {
        method: "POST",
        path: "/api/proxies/provider/order/{orderId}/reset-password",
        description: "Rotate residential proxy password",
        ...examples.resetPassword,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/order/{orderId}/proxies",
        description: "Static and Dedicated ISP proxy lines",
        ...examples.orderProxies,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/order/{orderId}/unlimited-metrics",
        description: "Unlimited Residential metrics",
        ...examples.unlimitedMetrics,
      },
    ],
  },
  {
    title: "Targeting",
    icon: Target,
    endpoints: [
      {
        method: "GET",
        path: "/api/proxies/provider/targeting/gresi",
        description: "gResidential targeting options",
        ...examples.gresiTargeting,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/targeting/mobile/countries",
        description: "Mobile countries",
        ...examples.mobileCountries,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/targeting/mobile/regions",
        description: "Mobile regions",
        ...examples.mobileRegions,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/targeting/mobile/cities",
        description: "Mobile cities",
        ...examples.mobileCities,
      },
      {
        method: "GET",
        path: "/api/proxies/provider/targeting/mobile/isps",
        description: "Mobile ISPs",
        ...examples.mobileIsps,
      },
    ],
  },
] satisfies Array<{
  title: string;
  icon: typeof KeyRound;
  endpoints: EndpointDoc[];
}>;

const errorCodes = [
  ["400", "Bad request or invalid parameters"],
  ["401", "Invalid or missing CatProxies API key"],
  ["403", "Reseller access denied"],
  ["404", "Resource does not exist"],
  ["429", "Rate limit exceeded"],
  ["500", "Provider API error"],
];

const explorerActions: Array<{ id: ExplorerAction; label: string }> = [
  { id: "account", label: "Account" },
  { id: "store", label: "Store" },
  { id: "servers", label: "Servers" },
  { id: "datacenterCountries", label: "DatacenterP countries" },
  { id: "orders", label: "Orders" },
  { id: "createOrder", label: "Create order" },
  { id: "orderDetails", label: "Order details" },
  { id: "extendOptions", label: "Extend options" },
  { id: "extendOrder", label: "Extend order" },
  { id: "whitelistList", label: "List whitelist IPs" },
  { id: "whitelistAdd", label: "Add whitelist IP" },
  { id: "whitelistRemove", label: "Remove whitelist IP" },
  { id: "usageStats", label: "Usage stats" },
  { id: "resetPassword", label: "Reset password" },
  { id: "orderProxies", label: "Order proxy lines" },
  { id: "unlimitedMetrics", label: "Unlimited metrics" },
  { id: "gresiTargeting", label: "gResidential targeting" },
  { id: "mobileCountries", label: "Mobile countries" },
  { id: "mobileRegions", label: "Mobile regions" },
  { id: "mobileCities", label: "Mobile cities" },
  { id: "mobileIsps", label: "Mobile ISPs" },
];

const parseBody = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  return JSON.parse(trimmed);
};

export function SupportPanel({ token }: SupportPanelProps) {
  const [action, setAction] = useState<ExplorerAction>("account");
  const [proxyType, setProxyType] = useState("gResidential");
  const [orderId, setOrderId] = useState("");
  const [countryId, setCountryId] = useState("1");
  const [regionId, setRegionId] = useState("");
  const [cityId, setCityId] = useState("");
  const [ip, setIp] = useState("");
  const [body, setBody] = useState(
    json({
      packageId: "package_id_here",
      ispData: {
        quantity: 5,
        countryId: 1,
      },
    })
  );
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [consoleResult, setConsoleResult] = useState("");
  const toast = useToast();

  const selectedAction = useMemo(
    () => explorerActions.find((item) => item.id === action),
    [action]
  );

  const runExplorer = async () => {
    setConsoleLoading(true);
    setConsoleResult("");

    try {
      let result: unknown;

      switch (action) {
        case "account":
          result = await api.providerAccount(token);
          break;
        case "store":
          result = await api.providerStore(token, proxyType || undefined);
          break;
        case "servers":
          result = await api.providerServers(token);
          break;
        case "datacenterCountries":
          result = await api.providerDatacenterCountries(token);
          break;
        case "orders":
          result = await api.providerOrders(token);
          break;
        case "createOrder":
          result = await api.providerCreateOrder(token, parseBody(body));
          break;
        case "orderDetails":
          result = await api.providerOrder(token, orderId);
          break;
        case "extendOptions":
          result = await api.providerExtendOptions(token, orderId);
          break;
        case "extendOrder":
          result = await api.providerExtendOrder(token, orderId, parseBody(body));
          break;
        case "whitelistList":
          result = await api.providerWhitelistIps(token, orderId);
          break;
        case "whitelistAdd":
          result = await api.providerAddWhitelistIp(token, orderId, {
            ip: ip || "203.0.113.10",
          });
          break;
        case "whitelistRemove":
          result = await api.providerRemoveWhitelistIp(token, orderId, {
            ip: ip || "203.0.113.10",
          });
          break;
        case "usageStats":
          result = await api.providerUsageStats(token, orderId);
          break;
        case "resetPassword":
          result = await api.providerResetPassword(token, orderId);
          break;
        case "orderProxies":
          result = await api.providerOrderProxies(token, orderId);
          break;
        case "unlimitedMetrics":
          result = await api.providerUnlimitedMetrics(token, orderId, {
            view: "overview",
            timeframe: "1day",
            interval: "1hour",
          });
          break;
        case "gresiTargeting":
          result = await api.providerGresiTargeting(token);
          break;
        case "mobileCountries":
          result = await api.providerMobileCountries(token);
          break;
        case "mobileRegions":
          result = await api.providerMobileRegions(token, countryId);
          break;
        case "mobileCities":
          result = await api.providerMobileCities(token, countryId, regionId);
          break;
        case "mobileIsps":
          result = await api.providerMobileIsps(
            token,
            countryId,
            regionId,
            cityId
          );
          break;
        default:
          result = null;
      }

      setConsoleResult(json(result));
    } catch (error) {
      toast.error(
        "API request failed",
        error instanceof Error ? error.message : "Unable to run API request"
      );
    } finally {
      setConsoleLoading(false);
    }
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Support</p>
          <h1>Reseller API</h1>
        </div>
      </div>

      <div className="support-hero">
        <div>
          <p className="eyebrow">UNIPROXIES Provider API</p>
          <h2>CatProxies reseller API, integrated inside this dashboard.</h2>
          <p>
            Use these internal endpoints from the UNIPROXIES backend. Your
            CatProxies API key stays server-side, while the dashboard calls
            authenticated `/api/proxies/provider/...` routes.
          </p>
        </div>
        <div className="support-stat-grid">
          <div>
            <strong>1000</strong>
            <span>requests/hour</span>
          </div>
          <div>
            <strong>60</strong>
            <span>mobile targeting requests / 10 min</span>
          </div>
        </div>
      </div>

      <div className="api-info-grid">
        <article>
          <KeyRound aria-hidden="true" size={22} />
          <h2>Authentication</h2>
          <p>
            Add `CATPROXIES_API_KEY` to the backend environment. The backend
            sends it to CatProxies using `Authorization: Bearer cp_...`.
          </p>
          <code>CATPROXIES_API_KEY=cp_your_api_key_here</code>
        </article>
        <article>
          <Database aria-hidden="true" size={22} />
          <h2>Base URL</h2>
          <p>
            The provider base URL is configurable, but defaults to the public
            reseller API base from the docs.
          </p>
          <code>https://catproxies.com/api/v1/public</code>
        </article>
        <article>
          <ShieldCheck aria-hidden="true" size={22} />
          <h2>Safe Integration</h2>
          <p>
            Frontend users never see the provider API key. All requests go
            through the secured Spring Boot API.
          </p>
          <code>/api/proxies/provider/*</code>
        </article>
      </div>

      <article className="api-console">
        <div className="api-console-heading">
          <div>
            <p className="eyebrow">Live API console</p>
            <h2>Run provider requests from this dashboard.</h2>
            <p>
              These controls call the Spring Boot proxy routes using your
              current login token. The provider API key stays in Render/backend
              environment variables.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={consoleLoading}
            onClick={runExplorer}
          >
            {consoleLoading ? "Running..." : `Run ${selectedAction?.label || "Request"}`}
          </button>
        </div>

        <div className="api-console-grid">
          <label>
            Endpoint
            <select
              value={action}
              onChange={(event) => setAction(event.target.value as ExplorerAction)}
            >
              {explorerActions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Proxy type
            <select
              value={proxyType}
              onChange={(event) => setProxyType(event.target.value)}
            >
              <option value="gResidential">Standard Residential</option>
              <option value="resix">Premium Residential</option>
              <option value="UnlimitedResidential">Unlimited Residential</option>
              <option value="RotatingMobile">Rotating Mobile</option>
              <option value="DatacenterP">DatacenterP</option>
              <option value="Ipv6p">IPv6</option>
              <option value="Isp">Static ISP</option>
              <option value="IspP">Dedicated ISP</option>
            </select>
          </label>

          <label>
            Order ID
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="ord_..."
            />
          </label>

          <label>
            Country ID
            <input
              value={countryId}
              onChange={(event) => setCountryId(event.target.value)}
              placeholder="1"
            />
          </label>

          <label>
            Region ID
            <input
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            City ID
            <input
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            Whitelist IP
            <input
              value={ip}
              onChange={(event) => setIp(event.target.value)}
              placeholder="203.0.113.10"
            />
          </label>

          <label className="api-console-body">
            JSON body
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={8}
            />
          </label>
        </div>

        {consoleResult ? (
          <pre className="api-console-result">{consoleResult}</pre>
        ) : null}
      </article>

      <div className="api-endpoint-list">
        {endpointGroups.map((group) => {
          const Icon = group.icon;
          return (
            <article key={group.title} className="api-endpoint-group">
              <div>
                <Icon aria-hidden="true" size={22} />
                <h2>{group.title}</h2>
              </div>
              <div className="api-endpoint-table">
                {group.endpoints.map((endpoint) => (
                  <details
                    className="api-endpoint-row"
                    key={`${endpoint.method}-${endpoint.path}`}
                  >
                    <summary>
                      <span
                        className={`method method-${endpoint.method.toLowerCase()}`}
                      >
                        {endpoint.method}
                      </span>
                      <code>{endpoint.path}</code>
                      <p>{endpoint.description}</p>
                      <ChevronDown aria-hidden="true" size={18} />
                    </summary>
                    <div className="api-endpoint-examples">
                      <article>
                        <h3>Request example</h3>
                        <pre>{endpoint.request}</pre>
                      </article>
                      <article>
                        <h3>Response example</h3>
                        <pre>{endpoint.response}</pre>
                      </article>
                    </div>
                  </details>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="api-example-grid">
        <article>
          <div>
            <Code2 aria-hidden="true" size={22} />
            <h2>Create ISP order</h2>
          </div>
          <pre>{`POST /api/proxies/provider/order
{
  "packageId": "package_id_here",
  "ispData": {
    "quantity": 5,
    "countryId": 1
  }
}`}</pre>
        </article>
        <article>
          <div>
            <CheckCircle2 aria-hidden="true" size={22} />
            <h2>Get credentials</h2>
          </div>
          <pre>{`GET /api/proxies/provider/order/{orderId}

Response includes order details,
proxy credentials, package data,
and status from CatProxies.`}</pre>
        </article>
      </div>

      <div className="api-error-panel">
        <div>
          <AlertTriangle aria-hidden="true" size={22} />
          <h2>Error handling</h2>
        </div>
        <div className="api-error-grid">
          {errorCodes.map(([code, text]) => (
            <div key={code}>
              <strong>{code}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
