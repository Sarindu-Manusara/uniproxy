"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Globe2,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  Server,
  ShieldCheck,
  ShoppingCart,
  Wifi,
} from "lucide-react";
import { api, formatCurrency, formatDate } from "@/lib/api";
import type { UserProxy } from "@/lib/types";
import { allocationValid, bandwidthLabel, durationLabel, emptyFilters, filterValues, matchesFilters, parseCountryStock, parseProviderPlan, unwrapArray } from "@/lib/proxy-catalog";
import type { CountryAllocation as Allocation, CountryStock, PlanCategory, PlanFilters, ProxyPlan } from "@/lib/proxy-catalog";
import { CountryAllocation } from "./CountryAllocation";
import { useToast } from "./ToastProvider";

type ProxiesPanelProps = {
  token: string;
  onChanged: () => void;
  viewMode?: "active" | "purchase" | "all";
};

type PaymentMethod = "Balance" | "Crypto";

type ProviderStoreStatus = Record<PlanCategory, boolean>;

const categoryTabs: Array<{ id: PlanCategory; label: string; badge?: string }> = [
  { id: "datacenter", label: "Datacenter" },
  { id: "ipv6", label: "IPv6" },
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

const providerProxyTypeFor = (category: PlanCategory) => {
  if (category === "datacenter") return "DatacenterP";
  if (category === "ipv6") return "Ipv6p";
  return "DatacenterP";
};

const visiblePlanLabel = (category: PlanCategory) =>
  categoryTabs.find((item) => item.id === category)?.label;

export function ProxiesPanel({
  token,
  onChanged,
  viewMode = "all",
}: ProxiesPanelProps) {
  const [proxies, setProxies] = useState<UserProxy[]>([]);
  const [providerPlans, setProviderPlans] = useState<ProxyPlan[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<PlanCategory>("datacenter");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [checkoutPlan, setCheckoutPlan] = useState<ProxyPlan | null>(null);
  const [filters, setFilters] = useState<PlanFilters>(emptyFilters);
  const [countries, setCountries] = useState<CountryStock[]>([]);
  const [allocation, setAllocation] = useState<Allocation>({});
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Balance");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerStoreStatus, setProviderStoreStatus] =
    useState<ProviderStoreStatus>({ datacenter: false, ipv6: false });
  const providerRequests = useRef(new Set<PlanCategory>());
  const countryRequest = useRef<Promise<void> | null>(null);
  const toast = useToast();
  const showPricing = viewMode !== "active";
  const showInventory = viewMode !== "purchase";

  const plans = providerPlans;

  const categoryPlans = useMemo(
    () => plans.filter((plan) => plan.category === activeCategory),
    [activeCategory, plans]
  );
  const visiblePlans = useMemo(() => categoryPlans.filter(plan => matchesFilters(plan, filters)), [categoryPlans, filters]);
  const allocationPlan = checkoutPlan ?? visiblePlans.find(plan => plan.id === selectedPlanId) ?? visiblePlans[0];
  const allocationTarget = allocationPlan?.ipCount ?? 0;
  const countryCapacity = useMemo(() => countries.reduce((sum, country) => sum + country.available, 0), [countries]);

  const activeDetails = categoryContent[activeCategory];

  const loadCountries = useCallback(async () => {
    if (countryRequest.current) return countryRequest.current;
    setCountriesLoading(true);
    const request = (async () => {
      try {
        setCountries(parseCountryStock(await api.providerDatacenterCountries(token)));
      } catch (error) {
        setCountries([]);
        toast.error("Country availability unavailable", error instanceof Error ? error.message : "Unable to load country availability.");
      } finally {
        setCountriesLoading(false);
        countryRequest.current = null;
      }
    })();
    countryRequest.current = request;
    return request;
  }, [toast, token]);

  useEffect(() => {
    if (showPricing && activeCategory === "datacenter") void loadCountries();
  }, [activeCategory, loadCountries, showPricing]);

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
    if (providerRequests.current.has(activeCategory)) return;
    providerRequests.current.add(activeCategory);
    setProviderLoading(true);

    try {
      const proxyType = providerProxyTypeFor(activeCategory);
      const response = await api.providerStore(token, proxyType);
      const parsed = unwrapArray(response)
        .map(parseProviderPlan)
        .filter((plan): plan is ProxyPlan => Boolean(plan) && plan?.category === activeCategory);

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
        toast.success("Plans refreshed", `${parsed.length} plans loaded.`);
      } else {
        toast.info("Plans refreshed", "No plans were returned for this category.");
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
        "Plans unavailable",
        requestError instanceof Error
          ? requestError.message
          : "Unable to load plans."
      );
    } finally {
      providerRequests.current.delete(activeCategory);
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
    if (plan.category === "datacenter") {
      if (!allocationValid(allocation, countries, plan.ipCount ?? 0)) setAllocation({});
      void loadCountries();
    }
    setPaymentMethod("Balance");
    setTermsAccepted(false);
  };

  const copyProxy = async (proxy: UserProxy) => {
    const value = `${proxy.ip}:${proxy.port}:${proxy.proxyUsername}:${proxy.proxyPassword}`;
    await navigator.clipboard.writeText(value);
    toast.success("Proxy copied", "Proxy credentials were copied to the clipboard.");
  };

  const checkoutSubtotal = checkoutPlan?.price ?? 0;
  const checkoutTotal = checkoutSubtotal;

  const submitCheckout = async () => {
    if (!checkoutPlan || !termsAccepted) {
      toast.error("Checkout blocked", "Accept the checkout terms before purchasing.");
      return;
    }

    if (paymentMethod !== "Balance") {
      toast.error("Checkout blocked", "Deposit balance first, then purchase plans from your account balance.");
      return;
    }

    const providerPackageId = checkoutPlan.providerPackageId;
    if (!providerPackageId) {
      toast.error(
        "Plan unavailable",
        "Refresh available plans and select a current package before buying."
      );
      return;
    }

    if (checkoutPlan.category === "datacenter" && (countriesLoading || !allocationValid(allocation, countries, checkoutPlan.ipCount ?? 0))) {
      toast.error("Country allocation required", `Allocate exactly ${checkoutPlan.ipCount ?? 0} IPs within available country stock.`);
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        packageId: providerPackageId,
        proxyType: checkoutPlan.providerProxyType,
        quantity: checkoutPlan.quantity,
      };

      if (checkoutPlan.category === "datacenter") {
        body.countryProxies = Object.fromEntries(Object.entries(allocation).filter(([, count]) => count > 0));
        body.highConcurrency = false;
        body.highPriority = false;
        body.whitelistedIps = false;
      }

      const response = await api.purchaseProxy(token, body);
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
                  {visiblePlanLabel(checkoutPlan.category)}
                </span>
              </div>
              <div className="plan-meta">
                <span>{checkoutPlan.term}</span>
                <span>{checkoutPlan.quantity.toLocaleString("en-US")} {checkoutPlan.unit}</span>
                {checkoutPlan.bandwidthGb !== null ? <span>{bandwidthLabel(checkoutPlan.bandwidthGb)}</span> : null}
              </div>
            </article>

            {checkoutPlan.category === "datacenter" ? <CountryAllocation countries={countries} target={allocationTarget} value={allocation} onChange={setAllocation} loading={countriesLoading} onRefresh={loadCountries} /> : null}

            <article className="checkout-card">
              <div className="checkout-card-heading">
                <div>
                  <p className="eyebrow">Payment method</p>
                  <h2>Select how to pay</h2>
                </div>
              </div>
              <div className="payment-method-grid">
                {(["Balance", "Crypto"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={paymentMethod === method ? "active" : ""}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method === "Balance" ? (
                      <PackageCheck aria-hidden="true" size={18} />
                    ) : (
                      <Globe2 aria-hidden="true" size={18} />
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
                I understand proxy usage rules, refund terms, and plan
                activation requirements.
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
                <strong>{visiblePlanLabel(checkoutPlan.category)}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>
                  {checkoutPlan.quantity.toLocaleString("en-US")}{" "}
                  {checkoutPlan.unit}
                </strong>
              </div>
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(checkoutSubtotal)}</strong>
              </div>
            </div>

            <button
              className="primary-button"
              type="button"
              disabled={loading || !termsAccepted || (checkoutPlan.category === "datacenter" && (countriesLoading || !allocationValid(allocation, countries, allocationTarget)))}
              onClick={submitCheckout}
            >
              <ShoppingCart aria-hidden="true" size={18} />
              {loading ? "Processing..." : "Buy Now"}
            </button>

            <p className="checkout-note">
              This uses your UniProxy balance and saves returned credentials
              into Active Plans.
            </p>
          </aside>
        </div>
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
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={providerLoading}
            onClick={loadProviderStore}
          >
            <RefreshCw aria-hidden="true" size={18} />
            {providerLoading ? "Refreshing..." : "Refresh plans"}
          </button>
        </div>

        <div className="plan-tabs proxy-category-tabs" role="group" aria-label="Proxy categories">
          {categoryTabs.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? "active" : ""}
              type="button"
              aria-pressed={activeCategory === category.id}
              disabled={providerLoading}
              onClick={() => {
                const nextPlan = plans.find((plan) => plan.category === category.id);
                setActiveCategory(category.id);
                setSelectedPlanId(nextPlan?.id || "");
                setFilters(emptyFilters);
                setAllocation({});
              }}
            >
              {category.id === "datacenter" ? <Server size={18} aria-hidden="true" /> : <Globe2 size={18} aria-hidden="true" />}
              {category.label}
            </button>
          ))}
        </div>

        <div className="plan-filters" aria-label="Plan filters">
          {([
            { key: "days", label: "Duration", format: durationLabel },
            { key: "ipCount", label: "IP Count", format: (value: number) => `${value.toLocaleString("en-US")} IPs` },
            { key: "bandwidthGb", label: "Bandwidth", format: bandwidthLabel },
          ] as Array<{ key: keyof PlanFilters; label: string; format: (value: number) => string }>).map(({ key, label, format }) => {
            const values = filterValues(categoryPlans, key);
            if (!values.length || (key === "ipCount" && activeCategory !== "datacenter")) return null;
            return (
              <section className="plan-filter-section" key={key} aria-label={label}>
                <div className="plan-filter-heading"><h2>{label}</h2><span className="filter-selection">{filters[key] === null ? "All" : format(filters[key])}</span></div>
                <div className={`plan-filter-options ${key === "ipCount" ? "ip-count-options" : ""}`} role="group" aria-label={label}>
                  {[null, ...values].map(value => {
                    const selected = filters[key] === value;
                    const available = value === null || categoryPlans.some(plan => matchesFilters(plan, { ...filters, [key]: value }));
                    return <button type="button" key={value ?? "all"} className={selected ? "active" : ""} aria-pressed={selected} disabled={providerLoading || !available} onClick={() => { setFilters(current => ({ ...current, [key]: value })); setAllocation({}); }}>{value === null ? "All" : format(value)}</button>;
                  })}
                </div>
              </section>
            );
          })}
          {activeCategory === "datacenter" && categoryPlans.length > 0 ? <CountryAllocation countries={countries} target={allocationTarget} value={allocation} onChange={setAllocation} loading={countriesLoading} onRefresh={loadCountries} /> : null}
        </div>

        <div className="pricing-layout">
          <div className="pricing-main">
            <div className="plan-results-heading"><h2>{visiblePlanLabel(activeCategory)} Plans</h2><button type="button" className="filter-reset" disabled={Object.values(filters).every(value => value === null)} onClick={() => { setFilters(emptyFilters); setAllocation({}); }}>Reset filters</button></div>

            <div className="plan-grid">
              {visiblePlans.length ? (
                visiblePlans.map((plan) => {
                  const stockReady = plan.category !== "datacenter" || (!countriesLoading && countryCapacity >= (plan.ipCount ?? 0));
                  return (
                  <article
                    key={plan.id}
                    className={`plan-card ${
                      selectedPlanId === plan.id ? "selected" : ""
                    }`}
                  >
                    <div className="plan-card-row">
                      <h3>{plan.name}</h3>
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
                        {plan.quantity.toLocaleString("en-US")} {plan.unit}
                      </span>
                      <span>{plan.category === "datacenter" && countriesLoading ? "Checking stock" : stockReady ? "Available now" : "Currently unavailable"}</span>
                      {plan.bandwidthGb !== null ? <span>{bandwidthLabel(plan.bandwidthGb)}</span> : null}
                    </div>

                    <button
                      className="primary-button"
                      type="button"
                      disabled={loading || !stockReady}
                      onClick={() => openCheckout(plan)}
                    >
                      <ShoppingCart aria-hidden="true" size={17} />
                      Proceed to Checkout
                    </button>
                  </article>
                  );
                })
              ) : (
                <p className="empty-plan-state">
                  {providerLoading
                    ? "Loading available packages..."
                    : "No plans are available for this selection."}
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
              <span>Secure plan delivery</span>
            </div>
            <div className="plan-assurance">
              <LockKeyhole aria-hidden="true" size={18} />
              <span>Private checkout payloads</span>
            </div>
            <div className="plan-assurance">
              <Wifi aria-hidden="true" size={18} />
              <span>Plan availability refresh</span>
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
    </section>
  );
}
