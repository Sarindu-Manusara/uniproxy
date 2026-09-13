"use client";

import { Minus, Plus, RefreshCw, RotateCcw, Shuffle } from "lucide-react";
import { allocationTotal, autoAllocate } from "@/lib/proxy-catalog";
import type { CountryAllocation as Allocation, CountryStock } from "@/lib/proxy-catalog";

type Props = {
  countries: CountryStock[];
  target: number;
  value: Allocation;
  onChange: (value: Allocation) => void;
  loading: boolean;
  onRefresh: () => void;
};

export function CountryAllocation({ countries, target, value, onChange, loading, onRefresh }: Props) {
  const total = allocationTotal(value);
  const capacity = countries.reduce((sum, country) => sum + country.available, 0);
  const update = (country: CountryStock, next: number) => {
    const current = value[country.code] ?? 0;
    const maximum = Math.min(country.available, Math.max(0, target - total + current));
    onChange({ ...value, [country.code]: Math.min(maximum, Math.max(0, Math.floor(next) || 0)) });
  };

  return (
    <section className="plan-filter-section country-allocation" aria-label="Country allocation" aria-busy={loading}>
      <div className="plan-filter-heading">
        <h2>Country Allocation</h2>
        <div className="allocation-actions">
          <button type="button" className="allocation-icon" title="Refresh availability" aria-label="Refresh country availability" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
          </button>
          <button type="button" className="allocation-icon" title="Clear allocation" aria-label="Clear allocation" onClick={() => onChange({})} disabled={loading || total === 0}>
            <RotateCcw size={16} aria-hidden="true" />
          </button>
          <button type="button" className="allocation-auto" onClick={() => onChange(autoAllocate(countries, target))} disabled={loading || !target || capacity < target}>
            <Shuffle size={16} aria-hidden="true" />Auto Allocate
          </button>
        </div>
      </div>
      <div className="allocation-progress">
        <progress aria-label="Allocated IPs" value={total} max={target || 1} />
        <span>{total.toLocaleString("en-US")} / {target.toLocaleString("en-US")}</span>
      </div>
      {countries.length ? (
        <div className="country-allocation-grid">
          {countries.map(country => {
            const count = value[country.code] ?? 0;
            return (
              <div className="country-allocation-item" key={country.code}>
                <div className="country-allocation-label"><span><b>{country.code}</b>{country.name}</span><small>{country.available.toLocaleString("en-US")} available</small></div>
                <div className="country-stepper">
                  <button type="button" title={`Remove one IP from ${country.name}`} aria-label={`Decrease ${country.name}`} disabled={loading || count === 0} onClick={() => update(country, count - 1)}><Minus size={16} aria-hidden="true" /></button>
                  <input type="number" aria-label={`${country.name} IP count`} min={0} max={Math.min(country.available, target - total + count)} step={1} value={count} disabled={loading || !target || country.available === 0} onChange={event => update(country, Number(event.target.value))} />
                  <button type="button" title={`Add one IP to ${country.name}`} aria-label={`Increase ${country.name}`} disabled={loading || !target || total >= target || count >= country.available} onClick={() => update(country, count + 1)}><Plus size={16} aria-hidden="true" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="allocation-status">{loading ? "Loading countries..." : "Country availability unavailable."}</p>}
      {!loading && countries.length > 0 && target > capacity ? <p className="allocation-status">Insufficient country stock for this package.</p> : null}
    </section>
  );
}
