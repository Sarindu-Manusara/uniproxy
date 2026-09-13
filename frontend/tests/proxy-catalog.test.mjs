import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/proxy-catalog.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const catalog = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const dc = (extra = {}) => catalog.parseProviderPlan({ packageId: "dc", title: "Datacenter package", proxyType: "DatacenterP", resellerPrice: "2.5", ips: 250, days: 7, bandwidth: "1000", ...extra });
const stock = [{ code: "US", name: "United States", available: 10 }, { code: "DE", name: "Germany", available: 100 }, { code: "CA", name: "Canada", available: 100 }];

test("structured store metadata drives filters, duration and exact price", () => {
  const plan = dc();
  assert.equal(plan.days, 7);
  assert.equal(plan.term, "7 days");
  assert.equal(plan.ipCount, 250);
  assert.equal(plan.bandwidthGb, 1000);
  assert.equal(plan.price, 2.5);
  assert.equal(catalog.durationLabel(7), "Weekly");
  assert.equal(catalog.bandwidthLabel(1000), "1TB");
});

test("explicit title metadata is supported without inventing missing values", () => {
  const plan = dc({ title: "Datacenter Proxies - 1 Month - 2,500 IPs - 5TB", ips: null, days: null, bandwidth: null });
  assert.equal(plan.days, 30);
  assert.equal(plan.ipCount, 2500);
  assert.equal(plan.bandwidthGb, 5000);
  const unknown = dc({ days: null, bandwidth: null });
  assert.equal(unknown, null);
});

test("IPv6 zero bandwidth means unlimited, not missing", () => {
  const plan = catalog.parseProviderPlan({ packageId: "ipv6", title: "IPv6", proxyType: "Ipv6p", price: 10, days: 1, bandwidth: "0", speed: 1000, ips: null });
  assert.equal(plan.bandwidthGb, 0);
  assert.equal(plan.speedMbps, 1000);
  assert.equal(plan.unit, "Mbps");
  assert.equal(plan.quantity, 1000);
  assert.equal(plan.ipCount, null);
  assert.equal(catalog.bandwidthLabel(0), "Unlimited");
  assert.equal(catalog.speedLabel(1000), "1Gbps");
});

test("IPv6 modes use only real metered or unlimited provider packages", () => {
  const metered = catalog.parseProviderPlan({ packageId: "ipv6-metered", title: "IPv6 250GB", proxyType: "Ipv6p", price: 10, days: 30, bandwidth: 250 });
  const unlimited = catalog.parseProviderPlan({ packageId: "ipv6-unlimited", title: "IPv6 Unlimited", proxyType: "Ipv6p", price: 20, days: 30, bandwidth: 0, speed: 1000 });
  const plans = [metered, unlimited];
  assert.deepEqual(catalog.filterValues(plans, "bandwidthGb"), [250, 0]);
  assert.deepEqual(catalog.filterValues(plans.filter((plan) => plan.bandwidthGb === 0), "speedMbps"), [1000]);
  assert.equal(plans.filter((plan) => plan.bandwidthGb > 0).length, 1);
  assert.equal(plans.filter((plan) => plan.bandwidthGb === 0).length, 1);
});

test("unsupported, hidden, invalid and unpurchasable products are excluded", () => {
  for (const extra of [{ proxyType: "RotatingMobile" }, { hidden: true }, { packageId: "" }, { resellerPrice: "bad" }, { resellerPrice: 0 }]) assert.equal(dc(extra), null);
});

test("combined filters match only real package combinations", () => {
  const plans = [dc(), dc({ packageId: "month", days: 30, bandwidth: 250 }), dc({ packageId: "large", days: 30, ips: 1000, bandwidth: 5000 })];
  assert.deepEqual(catalog.filterValues(plans, "days"), [7, 30]);
  assert.equal(plans.filter(plan => catalog.matchesFilters(plan, { days: 30, ipCount: 250, bandwidthGb: 250 })).length, 1);
  assert.equal(plans.filter(plan => catalog.matchesFilters(plan, { days: 7, ipCount: 1000, bandwidthGb: 250 })).length, 0);
});

test("live countries are parsed from the documented payload, without fabricated stock", () => {
  assert.deepEqual(catalog.parseCountryStock({ payload: { countries: [...stock, { code: "GB", available: 0 }, { code: "XX", available: -1 }, { code: "FR", available: null }, { code: "JP", available: [] }] } }).map(item => [item.code, item.available]), [["US", 10], ["DE", 100], ["CA", 100], ["GB", 0]]);
  assert.deepEqual(catalog.parseCountryStock({ payload: {} }), []);
});

test("auto allocation balances countries and redistributes around stock caps", () => {
  const allocation = catalog.autoAllocate(stock, 150);
  assert.equal(allocation.US, 10);
  assert.equal(catalog.allocationTotal(allocation), 150);
  assert.equal(catalog.allocationValid(allocation, stock, 150), true);
  assert.equal(Math.abs(allocation.DE - allocation.CA), 0);
  assert.equal(catalog.allocationValid(catalog.autoAllocate(stock, 300), stock, 300), false);
});

test("allocation rejects totals, fractions, negatives, unsupported countries and depleted stock", () => {
  for (const allocation of [{ US: 11, DE: 139 }, { DE: 149 }, { DE: 100.5, CA: 49.5 }, { US: -1, DE: 100, CA: 51 }, { XX: 150 }]) assert.equal(catalog.allocationValid(allocation, stock, 150), false);
  assert.equal(catalog.allocationValid({ DE: 100, CA: 50 }, stock.map(item => ({ ...item, available: 0 })), 150), false);
});
