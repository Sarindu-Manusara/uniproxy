export type PlanCategory = "datacenter" | "ipv6";

export type ProxyPlan = {
  id: string;
  category: PlanCategory;
  name: string;
  price: number;
  term: string;
  unit: string;
  quantity: number;
  days: number | null;
  ipCount: number | null;
  bandwidthGb: number | null;
  speedMbps: number | null;
  description: string;
  features: string[];
  providerProxyType: string;
  providerPackageId: string;
};

export type PlanFilters = {
  days: number | null;
  ipCount: number | null;
  bandwidthGb: number | null;
  speedMbps: number | null;
};

export type CountryStock = { code: string; name: string; available: number };
export type CountryAllocation = Record<string, number>;
export const emptyFilters: PlanFilters = {
  days: null,
  ipCount: null,
  bandwidthGb: null,
  speedMbps: null,
};

export function unwrapArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["payload", "data", "products", "packages", "store", "items", "countries"]) {
    const nested = unwrapArray(record[key]);
    if (nested.length) return nested;
  }
  return [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function number(value: unknown): number | null {
  if ((typeof value !== "string" && typeof value !== "number") || (typeof value === "string" && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function firstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const parsed = number(record[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

export function durationLabel(days: number): string {
  if (days === 1) return "Daily";
  if (days === 7) return "Weekly";
  if (days === 30) return "Monthly";
  return `${days} days`;
}

export function bandwidthLabel(gb: number): string {
  if (gb === 0) return "Unlimited";
  return gb >= 1000 && gb % 1000 === 0 ? `${gb / 1000}TB` : `${gb}GB`;
}

export function speedLabel(mbps: number): string {
  return mbps >= 1000 && mbps % 1000 === 0
    ? `${mbps / 1000}Gbps`
    : `${mbps}Mbps`;
}

export function parseProviderPlan(value: unknown): ProxyPlan | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const packageId = text(record.packageId) || text(record.id) || text(record._id);
  const name = text(record.title) || text(record.name) || text(record.packageName);
  const proxyType = text(record.proxyType) || text(record.type) || text(record.category);
  const categoryText = (proxyType || name).toLowerCase();
  const category = categoryText.includes("datacenter") ? "datacenter" : categoryText.includes("ipv6") ? "ipv6" : null;
  const price = firstNumber(record, ["resellerPrice", "price", "amount", "total"]);
  if (!packageId || !name || !category || record.hidden === true || price === null || price <= 0) return null;

  // Older store responses omitted metadata; only infer explicit units from the title.
  const durationText = text(record.period) || text(record.duration) || name;
  const durationMatch = durationText.match(/\b(\d+)\s*(day|week|month)s?\b/i);
  const titleDays = durationMatch ? Number(durationMatch[1]) * ({ day: 1, week: 7, month: 30 }[durationMatch[2].toLowerCase()] ?? 1) : null;
  const rawDays = firstNumber(record, ["days", "durationDays"]) ?? titleDays;
  const days = rawDays && Number.isInteger(rawDays) ? rawDays : null;
  const ipMatch = name.match(/\b([\d,]+)\s*IPs?\b/i);
  const rawIps = firstNumber(record, ["ips", "ipCount", "proxyNumber"]) ?? (category === "datacenter" ? number(record.quantity) : null) ?? (ipMatch ? Number(ipMatch[1].replaceAll(",", "")) : null);
  const ipCount = rawIps && Number.isInteger(rawIps) ? rawIps : null;
  const bandwidthMatch = name.match(/\b([\d.]+)\s*(GB|TB)\b/i);
  const bandwidthGb = firstNumber(record, ["bandwidthGb", "bandwidth", "traffic"]) ?? (bandwidthMatch ? Number(bandwidthMatch[1]) * (bandwidthMatch[2].toUpperCase() === "TB" ? 1000 : 1) : /\bunlimited\b/i.test(name) ? 0 : null);
  const speedMbps = firstNumber(record, ["speed", "speedMbps"]);
  if (!days || (category === "datacenter" && !ipCount) || bandwidthGb === null || (category === "ipv6" && bandwidthGb === 0 && !speedMbps)) return null;
  const quantity = category === "datacenter" ? ipCount ?? 1 : bandwidthGb && bandwidthGb > 0 ? bandwidthGb : speedMbps || 1;
  const unit = category === "datacenter" ? "IPs" : bandwidthGb && bandwidthGb > 0 ? "GB" : speedMbps ? "Mbps" : "Plan";

  return {
    id: `provider-${packageId}`, providerPackageId: packageId, category, name, price,
    days, ipCount, bandwidthGb, speedMbps, quantity, unit,
    term: days ? `${days} ${days === 1 ? "day" : "days"}` : text(record.period) || text(record.duration) || "Package",
    providerProxyType: category === "datacenter" ? "DatacenterP" : "Ipv6p",
    description: "", features: [],
  };
}

export function matchesFilters(plan: ProxyPlan, filters: PlanFilters): boolean {
  return (Object.keys(filters) as Array<keyof PlanFilters>).every(key => filters[key] === null || plan[key] === filters[key]);
}

export function filterValues(plans: ProxyPlan[], key: keyof PlanFilters): number[] {
  return [...new Set(plans.map(plan => plan[key]).filter((value): value is number => value !== null))]
    .sort((a, b) => key === "bandwidthGb" && (a === 0 || b === 0) ? (a === 0 ? 1 : -1) : a - b);
}

export function parseCountryStock(value: unknown): CountryStock[] {
  const countries = new Map<string, CountryStock>();
  for (const item of unwrapArray(value)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const code = text(record.code).toUpperCase();
    const available = number(record.available);
    if (!/^[A-Z]{2}$/.test(code) || available === null || !Number.isInteger(available)) continue;
    countries.set(code, { code, name: text(record.name) || code, available });
  }
  return [...countries.values()];
}

export function allocationTotal(allocation: CountryAllocation): number {
  return Object.values(allocation).reduce((sum, count) => sum + count, 0);
}

export function allocationValid(allocation: CountryAllocation, countries: CountryStock[], target: number): boolean {
  return target > 0 && allocationTotal(allocation) === target && Object.entries(allocation).every(([code, count]) =>
    Number.isInteger(count) && count >= 0 && count <= (countries.find(country => country.code === code)?.available ?? -1)
  );
}

export function autoAllocate(countries: CountryStock[], target: number): CountryAllocation {
  const allocation: CountryAllocation = {};
  let remaining = Math.max(0, Math.floor(target));
  let eligible = countries.filter(country => country.available > 0);
  while (remaining > 0 && eligible.length) {
    const share = Math.ceil(remaining / eligible.length);
    for (const country of eligible) {
      const count = Math.min(share, remaining, country.available - (allocation[country.code] ?? 0));
      allocation[country.code] = (allocation[country.code] ?? 0) + count;
      remaining -= count;
    }
    eligible = eligible.filter(country => country.available > (allocation[country.code] ?? 0));
  }
  return allocation;
}
