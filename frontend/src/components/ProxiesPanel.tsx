"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  Globe2,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  Server,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Wifi,
  Zap,
} from "lucide-react";
import { api, formatCurrency, formatDate } from "@/lib/api";
import type { UserProxy } from "@/lib/types";
import { useToast } from "./ToastProvider";

type ProxiesPanelProps = {
  token: string;
  onChanged: () => void;
  viewMode?: "active" | "purchase" | "all";
};

type PlanCategory = "datacenter" | "ipv6";
type PlanTier = "standard" | "premium" | "unlimited";
type PaymentMethod = "Balance" | "Crypto" | "Card";

type ProxyPlan = {
  id: string;
  category: PlanCategory;
  tier: PlanTier;
  name: string;
  price: number;
  term: string;
  unit: string;
  quantity: number;
  description: string;
  features: string[];
  providerProxyType: string;
  providerPackageId?: string;
  popular?: boolean;
  requiresCountry?: boolean;
  adjustableQuantity?: boolean;
};

type CountryOption = {
  id: string;
  name: string;
  code: string;
};

type ProviderStoreStatus = Record<PlanCategory, boolean>;

const categoryTabs: Array<{ id: PlanCategory; label: string; badge?: string }> = [
  { id: "datacenter", label: "Datacenter" },
  { id: "ipv6", label: "IPv6" },
];

const tierTabs: Array<{ id: PlanTier; label: string }> = [
  { id: "standard", label: "Standard" },
  { id: "premium", label: "Premium" },
  { id: "unlimited", label: "Unlimited" },
];

const countryOptions: CountryOption[] = [
  { id: "1", name: "United States", code: "US" },
  { id: "44", name: "United Kingdom", code: "GB" },
  { id: "49", name: "Germany", code: "DE" },
  { id: "33", name: "France", code: "FR" },
  { id: "31", name: "Netherlands", code: "NL" },
  { id: "65", name: "Singapore", code: "SG" },
  { id: "61", name: "Australia", code: "AU" },
  { id: "81", name: "Japan", code: "JP" },
];

const categoryContent: Record<
  PlanCategory,
  { title: string; copy: string; features: string[] }
> = {
  datacenter: {
    title: "Datacenter Proxies",
    copy:
      "Fast, stable proxy capacity for high-volume automation and repeatable browser workflows.",
    features: [
      "High-speed datacenter routes",
      "IP whitelist authentication",
      "Unlimited bandwidth options",
      "Dedicated and rotating pools",
    ],
  },
  ipv6: {
    title: "IPv6 Proxies",
    copy:
      "Large IPv6 address space for modern tools, social automation, and scalable account operations.",
    features: [
      "Massive fresh IPv6 pool",
      "Static and rotating sessions",
      "Country targeting",
      "HTTP and SOCKS5 access",
    ],
  },
};

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toTitle = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const providerProxyTypeFor = (category: PlanCategory) => {
  if (category === "datacenter") return "DatacenterP";
  if (category === "ipv6") return "Ipv6p";
  return "DatacenterP";
};

const unwrapArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [
      record.payload,
      record.data,
      record.store,
      record.packages,
      record.products,
      record.items,
      record.servers,
      record.proxies,
      record.lines,
      record.orders,
    ];

    for (const candidate of candidates) {
      const nested = unwrapArray(candidate);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
};

const inferCategory = (input: string): PlanCategory | null => {
  const text = input.toLowerCase();

  if (text.includes("datacenterp") || text.includes("datacenter")) return "datacenter";
  if (text.includes("ipv6p") || text.includes("ipv6")) return "ipv6";
  return null;
};

const inferTier = (input: string): PlanTier => {
  const text = input.toLowerCase();

  if (text.includes("premium")) {
    return "premium";
  }

  if (text.includes("unlimitedresidential") || text.includes("unlimited")) {
    return "unlimited";
  }

  return "standard";
};

const parseProviderPlan = (item: unknown): ProxyPlan | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = toTitle(record.id) || toTitle(record.packageId) || toTitle(record._id);
  const proxyType = toTitle(record.proxyType) || toTitle(record.type) || toTitle(record.category);
  const title =
    toTitle(record.title) ||
    toTitle(record.name) ||
    toTitle(record.packageName) ||
    `${proxyType || "Provider"} Package`;

  if (!id && !title) {
    return null;
  }

  const category = inferCategory(`${proxyType} ${title}`);
  if (!category) {
    return null;
  }
  const tier = inferTier(`${proxyType} ${title}`);
  const bandwidth =
    toNumber(record.bandwidthGb) ||
    toNumber(record.bandwidth) ||
    toNumber(record.traffic);
  const ips =
    toNumber(record.ips) ||
    toNumber(record.ipCount) ||
    toNumber(record.quantity);
  const speed = toNumber(record.speed) || toNumber(record.speedMbps);
  const quantity = category === "datacenter" ? ips || bandwidth || 1 : bandwidth || speed || 1;
  const unit = category === "datacenter" ? "IPs" : bandwidth ? "GB" : speed ? "Mbps" : "Plan";
  const price =
    toNumber(record.resellerPrice) ||
    toNumber(record.price) ||
    toNumber(record.amount) ||
    toNumber(record.total);

  return {
    id: `provider-${id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    category,
    tier,
    name: title,
    price,
    term: toTitle(record.period) || toTitle(record.duration) || "Provider term",
    unit,
    quantity,
    description: "Live provider product from the configured reseller API.",
    features: [
      "Live provider package",
      "Server-side API key protection",
      "Provider order endpoint ready",
    ],
    providerProxyType: proxyType || providerProxyTypeFor(category),
    providerPackageId: id || undefined,
    requiresCountry: category === "datacenter",
    adjustableQuantity: category === "datacenter",
  };
};

const visiblePlanLabel = (category: PlanCategory, tier: PlanTier) =>
  `${tierTabs.find((item) => item.id === tier)?.label} ${
    categoryTabs.find((item) => item.id === category)?.label
  }`;

export function ProxiesPanel({
  token,
  onChanged,
  viewMode = "all",
}: ProxiesPanelProps) {
  const [proxies, setProxies] = useState<UserProxy[]>([]);
  const [providerPlans, setProviderPlans] = useState<ProxyPlan[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<PlanCategory>("datacenter");
  const [activeTier, setActiveTier] = useState<PlanTier>("standard");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [checkoutPlan, setCheckoutPlan] = useState<ProxyPlan | null>(null);
  const [countryId, setCountryId] = useState(countryOptions[0].id);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Balance");
  const [packageId, setPackageId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerStoreStatus, setProviderStoreStatus] =
    useState<ProviderStoreStatus>({ datacenter: false, ipv6: false });
  const toast = useToast();
  const showPricing = viewMode !== "active";
  const showInventory = viewMode !== "purchase";

  const plans = providerPlans;

  const visiblePlans = useMemo(
    () =>
      plans.filter(
        (plan) => plan.category === activeCategory && plan.tier === activeTier
      ),
    [activeCategory, activeTier, plans]
  );

  const activeDetails = categoryContent[activeCategory];

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      setProxies(await api.proxies(token));
    } catch (requestError) {
      toast.error(
        "Active plans unavailable",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load proxies"
      );
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  const loadProviderStore = useCallback(async () => {
    setProviderLoading(true);

    try {
      const proxyType = providerProxyTypeFor(activeCategory);
      const response = await api.providerStore(token, proxyType);
      const parsed = unwrapArray(response)
        .map(parseProviderPlan)
        .filter((plan): plan is ProxyPlan => Boolean(plan));

      setProviderPlans((current) => {
        const otherCategories = current.filter(
          (plan) => plan.category !== activeCategory
        );
        return [...otherCategories, ...parsed];
      });
      setProviderStoreStatus((current) => ({
        ...current,
        [activeCategory]: true,
      }));

      if (parsed.length) {
        setSelectedPlanId((current) =>
          parsed.some((plan) => plan.id === current) ? current : parsed[0].id
        );
        toast.success("Provider store synced", `${parsed.length} live provider plans loaded.`);
      } else {
        toast.info("Provider store synced", "No live plans were returned for this category.");
      }
    } catch (requestError) {
      setProviderPlans((current) =>
        current.filter((plan) => plan.category !== activeCategory)
      );
      setProviderStoreStatus((current) => ({
        ...current,
        [activeCategory]: true,
      }));
      toast.error(
        "Provider store unavailable",
        requestError instanceof Error
          ? requestError.message
          : "Provider store unavailable."
      );
    } finally {
      setProviderLoading(false);
    }
  }, [activeCategory, toast, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!showPricing || providerStoreStatus[activeCategory]) {
      return;
    }

    void loadProviderStore();
  }, [activeCategory, loadProviderStore, providerStoreStatus, showPricing]);

  const openCheckout = (plan: ProxyPlan) => {
    setSelectedPlanId(plan.id);
    setCheckoutPlan(plan);
    setQuantity(plan.quantity || 1);
    setCountryId(countryOptions[0].id);
    setPackageId(plan.providerPackageId || "");
    setPaymentMethod("Balance");
    setCoupon("");
    setTermsAccepted(false);
    setCheckoutResult("");
  };

  const copyProxy = async (proxy: UserProxy) => {
    const value = `${proxy.ip}:${proxy.port}:${proxy.proxyUsername}:${proxy.proxyPassword}`;
    await navigator.clipboard.writeText(value);
    toast.success("Proxy copied", "Proxy credentials were copied to the clipboard.");
  };

  const checkoutSubtotal = checkoutPlan
    ? checkoutPlan.adjustableQuantity
      ? (checkoutPlan.price / Math.max(checkoutPlan.quantity, 1)) * quantity
      : checkoutPlan.price
    : 0;
  const couponDiscount = coupon.trim() ? Math.min(checkoutSubtotal * 0.1, 50) : 0;
  const processingFee = paymentMethod === "Card" ? checkoutSubtotal * 0.03 : 0;
  const checkoutTotal = Math.max(checkoutSubtotal - couponDiscount + processingFee, 0);

  const submitCheckout = async () => {
    if (!checkoutPlan || !termsAccepted) {
      toast.error("Checkout blocked", "Accept the checkout terms before purchasing.");
      return;
    }

    if (paymentMethod !== "Balance") {
      toast.error("Checkout blocked", "Deposit balance first, then purchase CatProxies plans from your account balance.");
      return;
    }

    const providerPackageId = packageId.trim() || checkoutPlan.providerPackageId;
    if (!providerPackageId) {
      toast.error(
        "Live package required",
        "Sync the CatProxies provider store and select a live package before buying."
      );
      return;
    }

    setLoading(true);
    setCheckoutResult("");

    try {
      const selectedCountry = countryOptions.find((item) => item.id === countryId);
      const body: Record<string, unknown> = {
        packageId: providerPackageId,
        proxyType: checkoutPlan.providerProxyType,
        quantity,
        countryId: toNumber(countryId, Number(countryId)),
        countryCode: selectedCountry?.code || "US",
      };

      if (checkoutPlan.category === "datacenter") {
        body.countryProxies = selectedCountry ? { [selectedCountry.code]: quantity } : {};
        body.highConcurrency = false;
        body.highPriority = false;
        body.whitelistedIps = false;
      }

      const response = await api.purchaseProxy(token, body);
      setCheckoutResult(JSON.stringify(response, null, 2));
      toast.success("Plan purchased", response.message);
      setCheckoutPlan(null);
      await refresh();
      onChanged();
    } catch (requestError) {
      toast.error(
        "Checkout failed",
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete checkout"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkoutPlan) {
    return (
      <section className="page-stack checkout-page">
        <div className="checkout-header">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setCheckoutPlan(null)}
          >
            <ArrowLeft aria-hidden="true" size={18} />
            Back to plans
          </button>
          <div>
            <p className="eyebrow">Plan checkout</p>
            <h1>{checkoutPlan.name}</h1>
            <p>
              {checkoutPlan.description} Configure the order, confirm terms, and
              complete checkout.
            </p>
          </div>
        </div>

        <div className="checkout-grid">
          <div className="checkout-main">
            <article className="checkout-card">
              <div className="checkout-card-heading">
                <div>
                  <p className="eyebrow">Package</p>
                  <h2>{checkoutPlan.name}</h2>
                </div>
                <span className="checkout-category">
                  {visiblePlanLabel(checkoutPlan.category, checkoutPlan.tier)}
                </span>
              </div>
              <p>{checkoutPlan.description}</p>
              <div className="checkout-feature-grid">
                {checkoutPlan.features.map((feature) => (
                  <span key={feature}>
                    <Check aria-hidden="true" size={16} />
                    {feature}
                  </span>
                ))}
              </div>
            </article>

            <article className="checkout-card checkout-controls">
              <div>
                <SlidersHorizontal aria-hidden="true" size={20} />
                <h2>Configuration</h2>
              </div>

              <label>
                Provider package ID
                <input
                  value={packageId}
                  onChange={(event) => setPackageId(event.target.value)}
                  placeholder="Required. Sync provider store or paste a CatProxies package id"
                />
                <span>
                  Purchases are sent to CatProxies. Local demo purchases are
                  disabled.
                </span>
              </label>

              {checkoutPlan.requiresCountry ? (
                <label>
                  Location
                  <select
                    value={countryId}
                    onChange={(event) => setCountryId(event.target.value)}
                  >
                    {countryOptions.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {checkoutPlan.adjustableQuantity ? (
                <label>
                  Quantity
                  <input
                    min={1}
                    max={10000}
                    type="number"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Math.max(1, Number(event.target.value) || 1))
                    }
                  />
                </label>
              ) : null}

              <label>
                Coupon code
                <input
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Optional"
                />
              </label>
            </article>

            <article className="checkout-card">
              <div className="checkout-card-heading">
                <div>
                  <p className="eyebrow">Payment method</p>
                  <h2>Select how to pay</h2>
                </div>
              </div>
              <div className="payment-method-grid">
                {(["Balance", "Crypto", "Card"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={paymentMethod === method ? "active" : ""}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method === "Balance" ? (
                      <PackageCheck aria-hidden="true" size={18} />
                    ) : method === "Crypto" ? (
                      <Globe2 aria-hidden="true" size={18} />
                    ) : (
                      <CreditCard aria-hidden="true" size={18} />
                    )}
                    {method}
                  </button>
                ))}
              </div>
            </article>

            <article className="checkout-card terms-card">
              <label>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                I understand proxy usage rules, refund terms, and that live
                provider orders require a valid provider package ID.
              </label>
            </article>
          </div>

          <aside className="checkout-summary">
            <div className="checkout-total">
              <span>Total Price</span>
              <strong>{formatCurrency(checkoutTotal)}</strong>
              <small>{checkoutPlan.term}</small>
            </div>

            <div className="summary-lines">
              <div>
                <span>Plan</span>
                <strong>{checkoutPlan.name}</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{visiblePlanLabel(checkoutPlan.category, checkoutPlan.tier)}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>
                  {checkoutPlan.adjustableQuantity ? quantity : checkoutPlan.quantity}{" "}
                  {checkoutPlan.unit}
                </strong>
              </div>
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(checkoutSubtotal)}</strong>
              </div>
              {couponDiscount ? (
                <div>
                  <span>Discount</span>
                  <strong>-{formatCurrency(couponDiscount)}</strong>
                </div>
              ) : null}
              {processingFee ? (
                <div>
                  <span>Payment fee</span>
                  <strong>{formatCurrency(processingFee)}</strong>
                </div>
              ) : null}
            </div>

            <button
              className="primary-button"
              type="button"
              disabled={loading || !termsAccepted}
              onClick={submitCheckout}
            >
              <ShoppingCart aria-hidden="true" size={18} />
              {loading ? "Processing..." : "Buy Now"}
            </button>

            <p className="checkout-note">
              This uses your UniProxy balance, buys the package from
              CatProxies, and saves returned credentials into Active Plans.
            </p>
          </aside>
        </div>

        {checkoutResult ? (
          <pre className="checkout-result">{checkoutResult}</pre>
        ) : null}
      </section>
    );
  }

  return (
    <section className="page-stack purchase-page">
      {showPricing ? (
      <section className="pricing-shell" aria-label="Pricing plans">
        <div className="pricing-heading">
          <div>
            <p className="eyebrow">Purchase a plan</p>
            <h1>Pricing Plans</h1>
            <p>
              Choose a category, select Standard, Premium, or Unlimited, then
              continue to the checkout flow.
            </p>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={providerLoading}
            onClick={loadProviderStore}
          >
            <RefreshCw aria-hidden="true" size={18} />
            {providerLoading ? "Syncing..." : "Sync provider store"}
          </button>
        </div>

        <div className="plan-tabs" role="tablist" aria-label="Proxy categories">
          {categoryTabs.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? "active" : ""}
              type="button"
              onClick={() => {
                const nextPlan = plans.find(
                  (plan) =>
                    plan.category === category.id && plan.tier === activeTier
                );
                setActiveCategory(category.id);
                setSelectedPlanId(nextPlan?.id || "");
              }}
            >
              {category.badge ? <span>{category.badge}</span> : null}
              {category.label}
            </button>
          ))}
        </div>

        <div className="tier-tabs" role="tablist" aria-label="Plan tiers">
          {tierTabs.map((tier) => (
            <button
              key={tier.id}
              className={activeTier === tier.id ? "active" : ""}
              type="button"
              onClick={() => {
                const nextPlan = plans.find(
                  (plan) =>
                    plan.category === activeCategory && plan.tier === tier.id
                );
                setActiveTier(tier.id);
                setSelectedPlanId(nextPlan?.id || "");
              }}
            >
              {tier.label}
            </button>
          ))}
        </div>

        <div className="pricing-layout">
          <div className="pricing-main">
            <h2>{visiblePlanLabel(activeCategory, activeTier)} Plans</h2>

            <div className="plan-grid">
              {visiblePlans.length ? (
                visiblePlans.map((plan) => (
                  <article
                    key={plan.id}
                    className={`plan-card ${
                      selectedPlanId === plan.id ? "selected" : ""
                    }`}
                  >
                    {plan.popular ? (
                      <span className="plan-badge">Popular</span>
                    ) : null}
                    <div className="plan-card-row">
                      <h3>{plan.name}</h3>
                      <p>{plan.description}</p>
                      <div className="plan-price">
                        <span>$</span>
                        <strong>
                          {formatCurrency(plan.price).replace("$", "")}
                        </strong>
                        <small>/{plan.term}</small>
                      </div>
                    </div>

                    <div className="plan-meta">
                      <span>
                        {plan.quantity} {plan.unit}
                      </span>
                      <span>Live CatProxies</span>
                    </div>

                    <button
                      className="primary-button"
                      type="button"
                      disabled={loading}
                      onClick={() => openCheckout(plan)}
                    >
                      <ShoppingCart aria-hidden="true" size={17} />
                      Proceed to Checkout
                    </button>
                  </article>
                ))
              ) : (
                <p className="empty-plan-state">
                  {providerLoading
                    ? "Loading live CatProxies packages..."
                    : "No live CatProxies packages are available for this selection."}
                </p>
              )}
            </div>
          </div>

          <aside className="pricing-info-panel">
            <h2>{activeDetails.title}</h2>
            <p>{activeDetails.copy}</p>
            <strong>All plans include:</strong>
            <ul>
              {activeDetails.features.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden="true" size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="plan-assurance">
              <ShieldCheck aria-hidden="true" size={18} />
              <span>Server-side provider API key protection</span>
            </div>
            <div className="plan-assurance">
              <LockKeyhole aria-hidden="true" size={18} />
              <span>Private checkout payloads</span>
            </div>
            <div className="plan-assurance">
              <Wifi aria-hidden="true" size={18} />
              <span>Provider store sync supported</span>
            </div>
          </aside>
        </div>
      </section>
      ) : null}

      {showInventory ? (
        <>
          <div className="section-heading inventory-heading">
            <div>
              <p className="eyebrow">Active plans</p>
              <h1>Proxy inventory</h1>
            </div>
            <button className="secondary-button" type="button" onClick={refresh}>
              <RefreshCw aria-hidden="true" size={18} />
              Refresh
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>IP</th>
                  <th>Port</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Expiry</th>
                  <th>Copy</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((proxy) => (
                  <tr key={proxy.id}>
                    <td>{proxy.ip}</td>
                    <td>{proxy.port}</td>
                    <td>{proxy.proxyUsername}</td>
                    <td>{proxy.proxyPassword}</td>
                    <td>{formatDate(proxy.expiryDate)}</td>
                    <td>
                      <button
                        className="icon-button table-icon"
                        type="button"
                        onClick={() => copyProxy(proxy)}
                        aria-label={`Copy proxy ${proxy.id}`}
                        title="Copy proxy"
                      >
                        <Copy aria-hidden="true" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && proxies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      <div className="empty-table-state">
                        <PackageCheck aria-hidden="true" size={22} />
                        <strong>No active plans</strong>
                        <span>
                          Purchased proxy plans and credentials will appear here.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {loading ? (
            <p className="muted-row">
              <Server aria-hidden="true" size={16} />
              Loading proxy data
            </p>
          ) : null}
        </>
      ) : null}

      <div className="provider-footnote">
        <Zap aria-hidden="true" size={18} />
        <span>
          API documentation and live provider order tools are available in the
          Support page.
        </span>
      </div>
    </section>
  );
}
