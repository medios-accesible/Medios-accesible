"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CodeRain from "../../components/CodeRain";
import { siteContent } from "../../data/siteContent";
import { supabase } from "../../lib/supabaseClient";

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

function getPlanIcon(tier: number) {
  if (tier === 1) return "</>";
  if (tier === 2) return "◎";
  if (tier === 3) return "▣";
  if (tier === 4) return "✦";
  return "◆";
}

function getModalAnimationClass(tier: number) {
  if (tier === 1) return "modal-build-blocks";
  if (tier === 2) return "modal-binary-shutter";
  if (tier === 3) return "modal-neon-scan";
  if (tier === 4) return "modal-glitch-grid";
  return "modal-portal-bloom";
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "Custom";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export default function ServicesPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [pressedPlanId, setPressedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      const { data: planData } = await supabase
        .from("service_plans")
        .select(
          "id, tier_number, package_name, primary_purpose, monthly_price, annual_price, buyout_price, reduced_buyout_price, included_services, limits, is_active, sort_order"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const { data: addonData } = await supabase
        .from("service_addons")
        .select("id, name, price_label, description, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setPlans((planData || []) as ServicePlan[]);
      setAddons((addonData || []) as ServiceAddon[]);
      setLoading(false);
    }

    loadServices();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedPlan(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-code-build-card]")
    );

    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            card.classList.add("code-built");
          } else {
            card.classList.remove("code-built");
          }
        });
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [plans]);

  return (
    <main className="services-playground-page">
      <header className="site-header services-site-header">
        <Link className="brand" href="/" aria-label="Medios Accesible Home">
          <img
            className="brand-logo-img"
            src={siteContent.brand.logo}
            alt="Medios Accesible logo"
          />
          <span>{siteContent.brand.name}</span>
        </Link>

        <nav className="nav" aria-label="Services navigation">
          <Link href="/">Home</Link>
          <Link className="active" href="/services">Services</Link>
          <Link href="/#portfolio">Portfolio</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <Link className="login-btn" href="/login">
          Open Portal ⊗
        </Link>
      </header>

      <section className="services-hero-playground">
        <img className="hero-bg-image services-hero-art" src={siteContent.hero.backgroundImage} alt="" />
        <CodeRain className="hero-canvas services-code-canvas" />

        <div className="floating-orb orb-one"></div>
        <div className="floating-orb orb-two"></div>
        <div className="floating-orb orb-three"></div>

        <div className="services-hero-content-playground">
          <div className="eyebrow kinetic-eyebrow">
            Custom code. Clear systems. Real growth.
          </div>

          <h1>
            Services Built
            <br />
            for <span className="gradient-text">Real Results.</span>
          </h1>

          <p>
            We build custom-coded websites, digital systems, SEO-ready structures,
            client portals, content workflows, and online growth systems with
            transparent service from planning to launch.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary magnetic-button" href="#plans">
              Explore Plans <span>→</span>
            </a>

            <Link className="btn btn-secondary magnetic-button" href="/#contact">
              Start a Project <span>&lt;/&gt;</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="services-intro-strip">
        <div className="marquee-track">
          <span>Websites</span>
          <span>SEO</span>
          <span>Portals</span>
          <span>Dashboards</span>
          <span>Content</span>
          <span>Automation</span>
          <span>Growth</span>
          <span>Websites</span>
          <span>SEO</span>
          <span>Portals</span>
          <span>Dashboards</span>
          <span>Content</span>
          <span>Automation</span>
          <span>Growth</span>
        </div>
      </section>

      <section className="services-plans-playground" id="plans">
        <div className="section-head centered reveal">
          <div>
            <div className="kicker">Monthly Website Plans</div>
            <h2>Choose the level of support your business needs.</h2>
          </div>

          <p>
            Tap any plan to open a full animated breakdown with included services,
            limits, annual pricing, and website buyout details.
          </p>
        </div>

        {loading ? (
          <article className="service-loading-card">
            <p>Loading services...</p>
          </article>
        ) : (
          <div className="services-plan-grid-playground">
            {plans.map((plan, index) => (
              <button
                className={`service-plan-tile-playground code-build-card reveal ${
                  pressedPlanId === plan.id ? "touching" : ""
                }`}
                data-code-build-card
                style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}
                type="button"
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                onPointerDown={() => setPressedPlanId(plan.id)}
                onPointerUp={() => setPressedPlanId(null)}
                onPointerLeave={() => setPressedPlanId(null)}
                onPointerCancel={() => setPressedPlanId(null)}
              >
                <div className="code-build-overlay" aria-hidden="true">
                  <span>{`const plan = "Tier ${plan.tier_number}";`}</span>
                  <span>{`build("${plan.package_name}")`}</span>
                  <span>{`price.monthly = ${plan.monthly_price};`}</span>
                  <span>{`deploy.status = "ready";`}</span>
                </div>

                <div className="code-build-border" aria-hidden="true"></div>
                <div className="tile-aurora"></div>
                <div className="service-icon-playground">{getPlanIcon(plan.tier_number)}</div>

                <div className="service-tile-copy">
                  <span>Tier {plan.tier_number}</span>
                  <h3>{plan.package_name}</h3>
                  <p>{plan.primary_purpose}</p>
                </div>

                <div className="service-tile-price">
                  <strong>{formatMoney(plan.monthly_price)}</strong>
                  <small>/month</small>
                </div>

                <div className="learn-more-playground">
                  View Details <span>→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="services-process-playground">
        <div className="section-head centered reveal">
          <div>
            <div className="kicker">Our Process</div>
            <h2>Simple. Transparent. Effective.</h2>
          </div>
        </div>

        <div className="process-row-playground">
          <article className="process-card-playground reveal">
            <span>01</span>
            <div className="process-icon-playground">▱</div>
            <h3>Discover</h3>
            <p>We learn about your business, goals, audience, services, and challenges.</p>
          </article>

          <article className="process-card-playground reveal">
            <span>02</span>
            <div className="process-icon-playground">▦</div>
            <h3>Plan</h3>
            <p>We map out the right package, pages, features, workflow, and roadmap.</p>
          </article>

          <article className="process-card-playground reveal">
            <span>03</span>
            <div className="process-icon-playground">&lt;/&gt;</div>
            <h3>Build</h3>
            <p>We build your site or system with clean code and modern structure.</p>
          </article>

          <article className="process-card-playground reveal">
            <span>04</span>
            <div className="process-icon-playground">↗</div>
            <h3>Launch & Support</h3>
            <p>We launch, monitor, update, maintain, and support your growth.</p>
          </article>
        </div>
      </section>

      <section className="services-addons-playground">
        <div className="section-head reveal">
          <div>
            <div className="kicker">Add-ons</div>
            <h2>Extra services when the project needs more.</h2>
          </div>

          <p>
            Add-ons are billed separately and only included when approved in writing.
          </p>
        </div>

        <div className="addon-grid-playground">
          {addons.map((addon, index) => (
            <article
              className="addon-card-playground code-build-card reveal"
              data-code-build-card
              style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}
              key={addon.id}
            >
              <div className="code-build-overlay addon-code-overlay" aria-hidden="true">
                <span>{`const addon = "${addon.name}";`}</span>
                <span>{`pricing = "${addon.price_label}";`}</span>
                <span>{`status = "available";`}</span>
                <span>{`render.addOnCard();`}</span>
              </div>

              <div className="code-build-border" aria-hidden="true"></div>

              <h3>{addon.name}</h3>
              <strong>{addon.price_label}</strong>
              {addon.description && <p>{addon.description}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="services-cta-playground reveal">
        <div className="cta-line-art"></div>

        <div>
          <div className="kicker">Ready to get started?</div>
          <h2>Let’s build something great together.</h2>
          <p>Have a project in mind? Reach out and we’ll map out the best plan.</p>
        </div>

        <Link className="btn btn-primary magnetic-button" href="/#contact">
          Get in Touch <span>→</span>
        </Link>
      </section>

      <footer className="services-footer-playground">
        <div>
          <Link className="brand" href="/">
            <img
              className="brand-logo-img"
              src={siteContent.brand.logo}
              alt="Medios Accesible logo"
            />
            <span>{siteContent.brand.name}</span>
          </Link>

          <p>Custom code. Clear systems. Real growth.</p>
        </div>

        <div>
          <h3>Company</h3>
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/#contact">Contact</Link>
        </div>

        <div>
          <h3>Connect</h3>
          <a href="mailto:mediosaccesible@gmail.com">mediosaccesible@gmail.com</a>
          <a href="tel:+17879074302">(787) 907-4302</a>
        </div>
      </footer>

      {selectedPlan && (
        <div className="service-modal-overlay-playground" role="dialog" aria-modal="true">
          <button
            className="service-modal-backdrop-playground"
            type="button"
            onClick={() => setSelectedPlan(null)}
            aria-label="Close service details"
          />

          <article
            className={`service-modal-card-playground ${getModalAnimationClass(
              selectedPlan.tier_number
            )}`}
          >
            <div className="modal-fx modal-fx-blocks" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="modal-fx modal-fx-binary" aria-hidden="true">
              <span>01001001</span>
              <span>10110110</span>
              <span>00110101</span>
              <span>11100010</span>
              <span>01011100</span>
              <span>10010111</span>
            </div>

            <div className="modal-fx modal-fx-scan" aria-hidden="true"></div>
            <div className="modal-fx modal-fx-grid" aria-hidden="true"></div>
            <div className="modal-fx modal-fx-bloom" aria-hidden="true"></div>

            <button
              className="service-modal-close-playground"
              type="button"
              onClick={() => setSelectedPlan(null)}
              aria-label="Close modal"
            >
              ×
            </button>

            <div className="service-modal-head-playground">
              <div>
                <p className="portal-kicker">Tier {selectedPlan.tier_number}</p>
                <h2>{selectedPlan.package_name}</h2>
                <p>{selectedPlan.primary_purpose}</p>
              </div>

              <div className="service-modal-price-playground">
                <strong>{formatMoney(selectedPlan.monthly_price)}</strong>
                <span>/month</span>
              </div>
            </div>

            <div className="service-modal-grid-playground">
              <section>
                <h3>Included Services</h3>
                <ul>
                  {(selectedPlan.included_services || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3>Limits / Exclusions</h3>
                <ul>
                  {(selectedPlan.limits || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="service-modal-finance-playground">
              <div>
                <span>Annual upfront</span>
                <strong>
                  {selectedPlan.annual_price
                    ? formatMoney(selectedPlan.annual_price)
                    : "Not listed"}
                </strong>
              </div>

              <div>
                <span>Standard buyout</span>
                <strong>
                  {selectedPlan.buyout_price
                    ? formatMoney(selectedPlan.buyout_price)
                    : "Not listed"}
                </strong>
              </div>

              <div>
                <span>Buyout after 12 months</span>
                <strong>
                  {selectedPlan.reduced_buyout_price
                    ? formatMoney(selectedPlan.reduced_buyout_price)
                    : "Not listed"}
                </strong>
              </div>
            </div>

            <div className="service-modal-actions-playground">
              <Link className="btn btn-primary" href="/#contact">
                Start This Plan <span>→</span>
              </Link>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setSelectedPlan(null)}
              >
                Close
              </button>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
