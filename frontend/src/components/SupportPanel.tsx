"use client";

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

type EndpointDoc = {
  method: string;
  path: string;
  description: string;
  request: string;
  response: string;
};

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
    request: "GET /api/proxies/provider/store?proxyType=Residential",
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

export function SupportPanel() {
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
