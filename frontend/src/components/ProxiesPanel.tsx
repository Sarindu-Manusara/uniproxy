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

type PlanCategory = "residential" | "mobile" | "datacenter" | "ipv6" | "isp";
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

const categoryTabs: Array<{ id: PlanCategory; label: string; badge?: string }> = [
  { id: "residential", label: "Residential" },
  { id: "mobile", label: "Mobile", badge: "NEW" },
  { id: "datacenter", label: "Datacenter" },
  { id: "ipv6", label: "IPv6" },
  { id: "isp", label: "ISP" },
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
  residential: {
    title: "Residential Proxies",
    copy:
      "Real-device IPs for clean browsing, scraping, account workflows, and high-trust sessions.",
    features: [
      "Rotating and sticky sessions",
      "Country, state, city, and ISP targeting",
      "HTTP and SOCKS5 access",
      "Username and password authentication",
    ],
  },
  mobile: {
    title: "Mobile Proxies",
    copy:
      "Carrier-grade 4G/5G routes for social, app, ad verification, and mobile-only testing.",
    features: [
      "Real mobile carrier identity",
      "Country, region, city, and ISP targeting",
      "Sticky or rotating sessions",
      "Low reputation risk profiles",
    ],
  },
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
  isp: {
    title: "ISP Proxies",
    copy:
      "Static residential-quality ISP routes for stable accounts, browsing, and long-running sessions.",
    features: [
      "Static ISP IPs",
      "Real consumer-network routing",
      "Unlimited bandwidth",
      "Extendable monthly access",
    ],
  },
};

const baseFeatures = {
  residential: [
    "20M+ residential IP pool",
    "Country targeting included",
    "Rotating and sticky sessions",
  ],
  premiumResidential: [
    "Premium clean residential routes",
    "City and ISP targeting",
    "Priority pool allocation",
  ],
  unlimitedResidential: [
    "Unlimited bandwidth",
    "Gateway server selection",
    "Rotating and static sessions",
  ],
  mobile: [
    "4G/5G carrier routes",
    "Sticky sessions",
    "HTTP and SOCKS5 access",
  ],
  datacenter: [
    "Fast datacenter pool",
    "IP whitelist authentication",
    "Unlimited concurrent connections",
  ],
  ipv6: [
    "Fresh IPv6 subnet access",
    "Static sessions available",
    "Country-level targeting",
  ],
  isp: [
    "Static ISP identity",
    "30 day access",
    "Unlimited bandwidth",
  ],
};

const buildPlans = (): ProxyPlan[] => {
  const residentialStandard = [
    [1, 2.5],
    [5, 10],
    [10, 18],
    [25, 40],
    [50, 75],
    [100, 140],
    [250, 315],
  ].map(([gb, price]) => ({
    id: `residential-standard-${gb}gb`,
    category: "residential" as const,
    tier: "standard" as const,
    name: `Standard Residential ${gb}GB`,
    price,
    term: "3 Months",
    unit: "GB",
    quantity: gb,
    description: "Balanced residential bandwidth for general proxy work.",
    features: baseFeatures.residential,
    providerProxyType: "gResidential",
    requiresCountry: true,
  }));

  const residentialPremium = [
    [1, 3.5],
    [5, 15],
    [10, 27],
    [25, 60],
    [50, 110],
    [100, 200],
    [250, 460],
  ].map(([gb, price]) => ({
    id: `residential-premium-${gb}gb`,
    category: "residential" as const,
    tier: "premium" as const,
    name: `Premium Residential ${gb}GB`,
    price,
    term: "3 Months",
    unit: "GB",
    quantity: gb,
    description: "Higher trust residential bandwidth for stricter targets.",
    features: baseFeatures.premiumResidential,
    providerProxyType: "resix",
    requiresCountry: true,
    popular: gb === 50,
  }));

  const residentialUnlimited = [
    ["1 Day", 14, 1],
    ["1 Week", 39, 7],
    ["1 Month", 119, 30],
    ["3 Months", 319, 90],
  ].map(([label, price, days]) => ({
    id: `residential-unlimited-${String(label).toLowerCase().replace(/\s+/g, "-")}`,
    category: "residential" as const,
    tier: "unlimited" as const,
    name: `Unlimited Residential ${label}`,
    price: Number(price),
    term: String(label),
    unit: "Plan",
    quantity: Number(days),
    description: "Unlimited residential gateway access for long-running work.",
    features: baseFeatures.unlimitedResidential,
    providerProxyType: "UnlimitedResidential",
    requiresCountry: true,
    popular: label === "1 Month",
  }));

  const mobileStandard = [
    [1, 8],
    [3, 22],
    [5, 35],
    [10, 65],
    [25, 150],
    [50, 280],
  ].map(([gb, price]) => ({
    id: `mobile-standard-${gb}gb`,
    category: "mobile" as const,
    tier: "standard" as const,
    name: `Mobile ${gb}GB`,
    price,
    term: "3 Months",
    unit: "GB",
    quantity: gb,
    description: "Mobile carrier bandwidth for testing and verification.",
    features: baseFeatures.mobile,
    providerProxyType: "RotatingMobile",
    requiresCountry: true,
  }));

  const mobilePremium = [
    [1, 12],
    [3, 33],
    [5, 52],
    [10, 95],
    [25, 220],
  ].map(([gb, price]) => ({
    id: `mobile-premium-${gb}gb`,
    category: "mobile" as const,
    tier: "premium" as const,
    name: `Premium Mobile ${gb}GB`,
    price,
    term: "3 Months",
    unit: "GB",
    quantity: gb,
    description: "Priority mobile bandwidth with better carrier quality.",
    features: [...baseFeatures.mobile, "Priority mobile pool"],
    providerProxyType: "RotatingMobile",
    requiresCountry: true,
    popular: gb === 10,
  }));

  const mobileUnlimited = [
    ["1 Day", 25, 1],
    ["1 Week", 120, 7],
    ["1 Month", 399, 30],
  ].map(([label, price, days]) => ({
    id: `mobile-unlimited-${String(label).toLowerCase().replace(/\s+/g, "-")}`,
    category: "mobile" as const,
    tier: "unlimited" as const,
    name: `Unlimited Mobile ${label}`,
    price: Number(price),
    term: String(label),
    unit: "Plan",
    quantity: Number(days),
    description: "Unlimited rotating mobile access for intensive workflows.",
    features: [...baseFeatures.mobile, "Unlimited bandwidth"],
    providerProxyType: "RotatingMobile",
    requiresCountry: true,
  }));

  const datacenterStandard = [
    [10, 10],
    [25, 22],
    [50, 40],
    [100, 72],
    [250, 160],
    [500, 295],
  ].map(([ips, price]) => ({
    id: `datacenter-standard-${ips}`,
    category: "datacenter" as const,
    tier: "standard" as const,
    name: `Datacenter ${ips} IPs`,
    price,
    term: "30 Days",
    unit: "IPs",
    quantity: ips,
    description: "Fast datacenter IPs for automation and browser profiles.",
    features: baseFeatures.datacenter,
    providerProxyType: "DatacenterP",
    adjustableQuantity: true,
  }));

  const datacenterPremium = [
    [10, 18],
    [25, 40],
    [50, 75],
    [100, 135],
    [250, 310],
  ].map(([ips, price]) => ({
    id: `datacenter-premium-${ips}`,
    category: "datacenter" as const,
    tier: "premium" as const,
    name: `Premium Datacenter ${ips} IPs`,
    price,
    term: "30 Days",
    unit: "IPs",
    quantity: ips,
    description: "Premium datacenter allocation with stronger routing options.",
    features: [...baseFeatures.datacenter, "Country-level allocation"],
    providerProxyType: "DatacenterP",
    requiresCountry: true,
    adjustableQuantity: true,
    popular: ips === 100,
  }));

  const datacenterUnlimited = [
    ["1 Day", 12],
    ["1 Week", 45],
    ["1 Month", 120],
  ].map(([label, price]) => ({
    id: `datacenter-unlimited-${String(label).toLowerCase().replace(/\s+/g, "-")}`,
    category: "datacenter" as const,
    tier: "unlimited" as const,
    name: `Unlimited Datacenter ${label}`,
    price: Number(price),
    term: String(label),
    unit: "Plan",
    quantity: 1,
    description: "Rotating datacenter gateway with unlimited traffic.",
    features: [...baseFeatures.datacenter, "Unlimited traffic"],
    providerProxyType: "DatacenterP",
  }));

  const ipv6Standard = [
    [10, 12],
    [25, 25],
    [50, 45],
    [100, 80],
    [250, 175],
  ].map(([ips, price]) => ({
    id: `ipv6-standard-${ips}`,
    category: "ipv6" as const,
    tier: "standard" as const,
    name: `IPv6 ${ips} IPs`,
    price,
    term: "30 Days",
    unit: "IPs",
    quantity: ips,
    description: "IPv6 proxy pack for modern automation tools.",
    features: baseFeatures.ipv6,
    providerProxyType: "Ipv6p",
    requiresCountry: true,
  }));

  const ipv6Premium = [
    [10, 20],
    [25, 42],
    [50, 75],
    [100, 140],
  ].map(([ips, price]) => ({
    id: `ipv6-premium-${ips}`,
    category: "ipv6" as const,
    tier: "premium" as const,
    name: `Premium IPv6 ${ips} IPs`,
    price,
    term: "30 Days",
    unit: "IPs",
    quantity: ips,
    description: "Premium IPv6 routes with cleaner subnet allocation.",
    features: [...baseFeatures.ipv6, "Priority subnet allocation"],
    providerProxyType: "Ipv6p",
    requiresCountry: true,
  }));

  const ipv6Unlimited = [
    ["1 Day", 8],
    ["1 Week", 25],
    ["1 Month", 79],
  ].map(([label, price]) => ({
    id: `ipv6-unlimited-${String(label).toLowerCase().replace(/\s+/g, "-")}`,
    category: "ipv6" as const,
    tier: "unlimited" as const,
    name: `Unlimited IPv6 ${label}`,
    price: Number(price),
    term: String(label),
    unit: "Plan",
    quantity: 1,
    description: "Unlimited IPv6 gateway plan for large-scale workflows.",
    features: [...baseFeatures.ipv6, "Unlimited sessions"],
    providerProxyType: "Ipv6p",
    requiresCountry: true,
  }));

  const ispStandard = [
    [5, 17.5],
    [10, 32],
    [25, 75],
    [50, 140],
    [100, 260],
  ].map(([ips, price]) => ({
    id: `isp-standard-${ips}`,
    category: "isp" as const,
    tier: "standard" as const,
    name: `ISP ${ips} IPs`,
    price,
    term: "30 Days",
    unit: "IPs",
    quantity: ips,
    description: "Static ISP proxies for stable sessions.",
    features: baseFeatures.isp,
    providerProxyType: "Isp",
    requiresCountry: true,
    adjustableQuantity: true,
  }));

  const ispPremium = [
    [5, 25],
    [10, 46],
    [25, 110],
    [50, 205],
    [100, 390],
  ].map(([ips, price]) => ({
    id: `isp-premium-${ips}`,
    category: "isp" as const,
    tier: "premium" as const,
    name: `Premium ISP ${ips} IPs`,
    price,
    term: "30 Days",
    unit: "IPs",
    quantity: ips,
    description: "Cleaner ISP allocation for accounts and long-lived sessions.",
    features: [...baseFeatures.isp, "Premium ISP pool"],
    providerProxyType: "IspP",
    requiresCountry: false,
    adjustableQuantity: true,
    popular: ips === 25,
  }));

  const ispUnlimited = [
    [1, 9],
    [5, 40],
    [10, 75],
    [25, 175],
  ].map(([ips, price]) => ({
    id: `isp-unlimited-${ips}`,
    category: "isp" as const,
    tier: "unlimited" as const,
    name: `Unlimited ISP ${ips} IPs`,
    price,
    term: "30 Days",
    unit: "IPs",
    quantity: ips,
    description: "Static ISP proxies with unlimited bandwidth.",
    features: [...baseFeatures.isp, "Unlimited bandwidth"],
    providerProxyType: "IspP",
    requiresCountry: false,
    adjustableQuantity: true,
  }));

  return [
    ...residentialStandard,
    ...residentialPremium,
    ...residentialUnlimited,
    ...mobileStandard,
    ...mobilePremium,
    ...mobileUnlimited,
    ...datacenterStandard,
    ...datacenterPremium,
    ...datacenterUnlimited,
    ...ipv6Standard,
    ...ipv6Premium,
    ...ipv6Unlimited,
    ...ispStandard,
    ...ispPremium,
    ...ispUnlimited,
  ];
};

const fallbackPlans = buildPlans();

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toTitle = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const providerProxyTypeFor = (
  category: PlanCategory,
  tier: PlanTier = "standard"
) => {
  if (category === "residential") {
    if (tier === "premium") return "resix";
    if (tier === "unlimited") return "UnlimitedResidential";
    return "gResidential";
  }

  if (category === "mobile") return "RotatingMobile";
  if (category === "datacenter") return "DatacenterP";
  if (category === "ipv6") return "Ipv6p";
  if (category === "isp") return tier === "premium" ? "IspP" : "Isp";
  return "gResidential";
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

const inferCategory = (input: string): PlanCategory => {
  const text = input.toLowerCase();

  if (text.includes("rotatingmobile") || text.includes("mobile")) return "mobile";
  if (text.includes("datacenterp") || text.includes("datacenter")) return "datacenter";
  if (text.includes("ipv6p") || text.includes("ipv6")) return "ipv6";
  if (text.includes("ispp") || text.includes("isp")) return "isp";
  return "residential";
};

const inferTier = (input: string): PlanTier => {
  const text = input.toLowerCase();

  if (text.includes("resix") || text.includes("ispp") || text.includes("premium") || text.includes("resi bd") || text.includes("resibd")) {
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
  const tier = inferTier(`${proxyType} ${title}`);
  const quantity =
    toNumber(record.bandwidthGb) ||
    toNumber(record.bandwidth) ||
    toNumber(record.traffic) ||
    toNumber(record.ips) ||
    toNumber(record.quantity) ||
    1;
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
    unit: category === "residential" || category === "mobile" ? "GB" : "IPs",
    quantity,
    description: "Live provider product from the configured reseller API.",
    features: [
      "Live provider package",
      "Server-side API key protection",
      "Provider order endpoint ready",
    ],
    providerProxyType: proxyType || providerProxyTypeFor(category, tier),
    providerPackageId: id || undefined,
    requiresCountry: proxyType === "Isp" || (category !== "datacenter" && proxyType !== "IspP"),
    adjustableQuantity: category === "isp" || category === "datacenter",
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
    useState<PlanCategory>("residential");
  const [activeTier, setActiveTier] = useState<PlanTier>("standard");
  const [selectedPlanId, setSelectedPlanId] = useState(fallbackPlans[0].id);
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
  const toast = useToast();
  const showPricing = viewMode !== "active";
  const showInventory = viewMode !== "purchase";

  const plans = useMemo(
    () => [...providerPlans, ...fallbackPlans],
    [providerPlans]
  );

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
      const proxyType = providerProxyTypeFor(activeCategory, activeTier);
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

      if (parsed.length) {
        toast.success("Provider store synced", `${parsed.length} live provider plans loaded.`);
      } else {
        toast.info("Provider store synced", "No live plans were returned for this category.");
      }
    } catch (requestError) {
      toast.error(
        "Provider store unavailable",
        requestError instanceof Error
          ? requestError.message
          : "Provider store unavailable. Showing UniProxy catalog."
      );
    } finally {
      setProviderLoading(false);
    }
  }, [activeCategory, activeTier, toast, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
                setSelectedPlanId(nextPlan?.id || fallbackPlans[0].id);
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
                if (nextPlan) {
                  setSelectedPlanId(nextPlan.id);
                }
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
              {visiblePlans.map((plan) => (
                <article
                  key={plan.id}
                  className={`plan-card ${
                    selectedPlanId === plan.id ? "selected" : ""
                  }`}
                >
                  {plan.popular ? <span className="plan-badge">Popular</span> : null}
                  <div className="plan-card-row">
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                    <div className="plan-price">
                      <span>$</span>
                      <strong>{formatCurrency(plan.price).replace("$", "")}</strong>
                      <small>/{plan.term}</small>
                    </div>
                  </div>

                  <div className="plan-meta">
                    <span>{plan.quantity} {plan.unit}</span>
                    <span>{plan.providerPackageId ? "Live provider" : "UniProxy catalog"}</span>
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
              ))}
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
