"use client";

import Link from "next/link";
import AdminMobileNav from "../../../components/AdminMobileNav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type ServicePlan = {
  id: string;
  tier_number: number;
  package_name: string;
  primary_purpose: string | null;
  monthly_price: number;
  annual_price: number | null;
  buyout_price: number | null;
  reduced_buyout_price: number | null;
  included_services: string[] | null;
  limits: string[] | null;
  is_active: boolean;
  sort_order: number;
};

type ServiceAddon = {
  id: string;
  name: string;
  price_label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type AdminTab = "plans" | "addons";

function arrayToText(value: string[] | null) {
  return (value || []).join("\\n");
}

function textToArray(value: string) {
  return value
    .split("\\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminServicesPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("plans");
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [tierNumber, setTierNumber] = useState("1");
  const [packageName, setPackageName] = useState("");
  const [primaryPurpose, setPrimaryPurpose] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("0");
  const [annualPrice, setAnnualPrice] = useState("");
  const [buyoutPrice, setBuyoutPrice] = useState("");
  const [reducedBuyoutPrice, setReducedBuyoutPrice] = useState("");
  const [includedServices, setIncludedServices] = useState("");
  const [limits, setLimits] = useState("");
  const [planActive, setPlanActive] = useState(true);
  const [planSortOrder, setPlanSortOrder] = useState("1");

  const [selectedAddon, setSelectedAddon] = useState<ServiceAddon | null>(null);
  const [addonName, setAddonName] = useState("");
  const [addonPriceLabel, setAddonPriceLabel] = useState("");
  const [addonDescription, setAddonDescription] = useState("");
  const [addonActive, setAddonActive] = useState(true);
  const [addonSortOrder, setAddonSortOrder] = useState("1");

  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingAddon, setSavingAddon] = useState(false);

  useEffect(() => {
    async function setDeveloperLoggedIn() {
      await supabase.from("developer_presence").upsert({
        id: "main",
        is_logged_in: true,
        last_seen_at: new Date().toISOString()
      });
    }

    setDeveloperLoggedIn();
  }, []);

  useEffect(() => {
    async function loadAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/client");
        return;
      }

      await loadServices();
      setLoading(false);
    }

    loadAdmin();
  }, [router]);

  async function loadServices() {
    const { data: planData } = await supabase
      .from("service_plans")
      .select("id, tier_number, package_name, primary_purpose, monthly_price, annual_price, buyout_price, reduced_buyout_price, included_services, limits, is_active, sort_order")
      .order("sort_order", { ascending: true });

    const { data: addonData } = await supabase
      .from("service_addons")
      .select("id, name, price_label, description, is_active, sort_order")
      .order("sort_order", { ascending: true });

    setPlans((planData || []) as ServicePlan[]);
    setAddons((addonData || []) as ServiceAddon[]);
  }

  function resetPlanForm() {
    setSelectedPlan(null);
    setTierNumber("1");
    setPackageName("");
    setPrimaryPurpose("");
    setMonthlyPrice("0");
    setAnnualPrice("");
    setBuyoutPrice("");
    setReducedBuyoutPrice("");
    setIncludedServices("");
    setLimits("");
    setPlanActive(true);
    setPlanSortOrder("1");
  }

  function editPlan(plan: ServicePlan) {
    setSelectedPlan(plan);
    setTierNumber(String(plan.tier_number));
    setPackageName(plan.package_name);
    setPrimaryPurpose(plan.primary_purpose || "");
    setMonthlyPrice(String(plan.monthly_price));
    setAnnualPrice(plan.annual_price === null ? "" : String(plan.annual_price));
    setBuyoutPrice(plan.buyout_price === null ? "" : String(plan.buyout_price));
    setReducedBuyoutPrice(
      plan.reduced_buyout_price === null ? "" : String(plan.reduced_buyout_price)
    );
    setIncludedServices(arrayToText(plan.included_services));
    setLimits(arrayToText(plan.limits));
    setPlanActive(plan.is_active);
    setPlanSortOrder(String(plan.sort_order));
    setActiveTab("plans");
  }

  async function savePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPlan(true);

    const payload = {
      tier_number: Number(tierNumber),
      package_name: packageName.trim(),
      primary_purpose: primaryPurpose.trim() || null,
      monthly_price: Number(monthlyPrice),
      annual_price: annualPrice.trim() ? Number(annualPrice) : null,
      buyout_price: buyoutPrice.trim() ? Number(buyoutPrice) : null,
      reduced_buyout_price: reducedBuyoutPrice.trim() ? Number(reducedBuyoutPrice) : null,
      included_services: textToArray(includedServices),
      limits: textToArray(limits),
      is_active: planActive,
      sort_order: Number(planSortOrder)
    };

    const { error } = selectedPlan
      ? await supabase.from("service_plans").update(payload).eq("id", selectedPlan.id)
      : await supabase.from("service_plans").insert(payload);

    setSavingPlan(false);

    if (error) {
      alert(error.message);
      return;
    }

    resetPlanForm();
    await loadServices();
  }

  async function deletePlan(planId: string) {
    const confirmed = window.confirm("Delete this service plan?");
    if (!confirmed) return;

    const { error } = await supabase.from("service_plans").delete().eq("id", planId);

    if (error) {
      alert(error.message);
      return;
    }

    resetPlanForm();
    await loadServices();
  }

  function resetAddonForm() {
    setSelectedAddon(null);
    setAddonName("");
    setAddonPriceLabel("");
    setAddonDescription("");
    setAddonActive(true);
    setAddonSortOrder("1");
  }

  function editAddon(addon: ServiceAddon) {
    setSelectedAddon(addon);
    setAddonName(addon.name);
    setAddonPriceLabel(addon.price_label);
    setAddonDescription(addon.description || "");
    setAddonActive(addon.is_active);
    setAddonSortOrder(String(addon.sort_order));
    setActiveTab("addons");
  }

  async function saveAddon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddon(true);

    const payload = {
      name: addonName.trim(),
      price_label: addonPriceLabel.trim(),
      description: addonDescription.trim() || null,
      is_active: addonActive,
      sort_order: Number(addonSortOrder)
    };

    const { error } = selectedAddon
      ? await supabase.from("service_addons").update(payload).eq("id", selectedAddon.id)
      : await supabase.from("service_addons").insert(payload);

    setSavingAddon(false);

    if (error) {
      alert(error.message);
      return;
    }

    resetAddonForm();
    await loadServices();
  }

  async function deleteAddon(addonId: string) {
    const confirmed = window.confirm("Delete this add-on?");
    if (!confirmed) return;

    const { error } = await supabase.from("service_addons").delete().eq("id", addonId);

    if (error) {
      alert(error.message);
      return;
    }

    resetAddonForm();
    await loadServices();
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading service manager...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell admin-shell-wide">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Admin Services Manager</p>
            <h1>Services, Plans & Pricing</h1>
            <p>Edit every public service tier, add-on, description, limit, and price.</p>
          </div>

          <div className="portal-header-actions">
            <Link className="portal-link" href="/">
              Home
            </Link>

            <Link className="portal-link" href="/admin">
              ← Admin
            </Link>
          </div>
        </header>

        <nav className="admin-module-tabs" aria-label="Service manager tabs">
          <button
            className={activeTab === "plans" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("plans")}
          >
            Plans
          </button>

          <button
            className={activeTab === "addons" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("addons")}
          >
            Add-ons
          </button>

          <Link href="/services">Public Page ↗</Link>
        </nav>

        {activeTab === "plans" ? (
          <div className="admin-editor-layout">
            <article className="portal-card">
              <h2>{selectedPlan ? "Edit Plan" : "Create Plan"}</h2>

              <form className="portal-form service-admin-form" onSubmit={savePlan}>
                <div className="admin-form-row">
                  <label>
                    Tier Number
                    <input
                      type="number"
                      value={tierNumber}
                      onChange={(event) => setTierNumber(event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Sort Order
                    <input
                      type="number"
                      value={planSortOrder}
                      onChange={(event) => setPlanSortOrder(event.target.value)}
                      required
                    />
                  </label>
                </div>

                <label>
                  Package Name
                  <input
                    value={packageName}
                    onChange={(event) => setPackageName(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Primary Purpose
                  <textarea
                    value={primaryPurpose}
                    onChange={(event) => setPrimaryPurpose(event.target.value)}
                  />
                </label>

                <div className="admin-form-row">
                  <label>
                    Monthly Price
                    <input
                      type="number"
                      value={monthlyPrice}
                      onChange={(event) => setMonthlyPrice(event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Annual Price
                    <input
                      type="number"
                      value={annualPrice}
                      onChange={(event) => setAnnualPrice(event.target.value)}
                    />
                  </label>
                </div>

                <div className="admin-form-row">
                  <label>
                    Buyout Price
                    <input
                      type="number"
                      value={buyoutPrice}
                      onChange={(event) => setBuyoutPrice(event.target.value)}
                    />
                  </label>

                  <label>
                    Reduced Buyout
                    <input
                      type="number"
                      value={reducedBuyoutPrice}
                      onChange={(event) => setReducedBuyoutPrice(event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Included Services
                  <textarea
                    value={includedServices}
                    onChange={(event) => setIncludedServices(event.target.value)}
                    placeholder="One included service per line"
                  />
                </label>

                <label>
                  Limits / Exclusions
                  <textarea
                    value={limits}
                    onChange={(event) => setLimits(event.target.value)}
                    placeholder="One limit per line"
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={planActive}
                    onChange={(event) => setPlanActive(event.target.checked)}
                  />
                  Active on public services page
                </label>

                <button className="auth-submit" type="submit" disabled={savingPlan}>
                  {savingPlan ? "Saving..." : selectedPlan ? "Save Plan" : "Create Plan"}
                </button>

                {selectedPlan && (
                  <button className="portal-link" type="button" onClick={resetPlanForm}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </article>

            <article className="portal-card">
              <h2>Current Plans</h2>

              <div className="portal-list">
                {plans.map((plan) => (
                  <div className="portal-list-item admin-list-editor-item" key={plan.id}>
                    <div>
                      <h3>Tier {plan.tier_number} - {plan.package_name}</h3>
                      <p>
                        ${plan.monthly_price}/mo · {plan.is_active ? "Active" : "Hidden"}
                      </p>
                    </div>

                    <div className="blog-admin-actions">
                      <button type="button" onClick={() => editPlan(plan)}>
                        Edit
                      </button>

                      <button type="button" onClick={() => deletePlan(plan.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        ) : (
          <div className="admin-editor-layout">
            <article className="portal-card">
              <h2>{selectedAddon ? "Edit Add-on" : "Create Add-on"}</h2>

              <form className="portal-form service-admin-form" onSubmit={saveAddon}>
                <label>
                  Add-on Name
                  <input
                    value={addonName}
                    onChange={(event) => setAddonName(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Price Label
                  <input
                    value={addonPriceLabel}
                    onChange={(event) => setAddonPriceLabel(event.target.value)}
                    placeholder="$40/hour or Custom quote"
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={addonDescription}
                    onChange={(event) => setAddonDescription(event.target.value)}
                  />
                </label>

                <label>
                  Sort Order
                  <input
                    type="number"
                    value={addonSortOrder}
                    onChange={(event) => setAddonSortOrder(event.target.value)}
                    required
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={addonActive}
                    onChange={(event) => setAddonActive(event.target.checked)}
                  />
                  Active on public services page
                </label>

                <button className="auth-submit" type="submit" disabled={savingAddon}>
                  {savingAddon ? "Saving..." : selectedAddon ? "Save Add-on" : "Create Add-on"}
                </button>

                {selectedAddon && (
                  <button className="portal-link" type="button" onClick={resetAddonForm}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </article>

            <article className="portal-card">
              <h2>Current Add-ons</h2>

              <div className="portal-list">
                {addons.map((addon) => (
                  <div className="portal-list-item admin-list-editor-item" key={addon.id}>
                    <div>
                      <h3>{addon.name}</h3>
                      <p>
                        {addon.price_label} · {addon.is_active ? "Active" : "Hidden"}
                      </p>
                    </div>

                    <div className="blog-admin-actions">
                      <button type="button" onClick={() => editAddon(addon)}>
                        Edit
                      </button>

                      <button type="button" onClick={() => deleteAddon(addon.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}
      </section>
          <AdminMobileNav />
    </main>
  );
}
