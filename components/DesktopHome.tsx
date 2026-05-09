"use client";

import { useEffect, useMemo, useState } from "react";
import CodeRain from "./CodeRain";
import { siteContent, type FeatureIcon } from "../data/siteContent";

function Icon({ type }: { type: FeatureIcon }) {
  if (type === "website") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2"></rect>
        <path d="M8 9h8M8 13h5"></path>
      </svg>
    );
  }

  if (type === "client") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M5 20c1.4-4 12.6-4 14 0"></path>
      </svg>
    );
  }

  if (type === "shopping-bag") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8Z"></path>
        <path d="M9 8V6a3 3 0 0 1 6 0v2"></path>
      </svg>
    );
  }

  if (type === "eye") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    );
  }

  if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2"></path>
        <path d="M4 9l6-4 6 7 6-5"></path>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z"></path>
      <path d="M12 22V12M3 7l9 5 9-5"></path>
    </svg>
  );
}

export default function DesktopHome() {
  const [year, setYear] = useState("2026");

  const navSections = useMemo(
    () => ["home", "services", "portfolio", "blog", "contact"],
    []
  );

  useEffect(() => {
    setYear(String(new Date().getFullYear()));

    const revealItems = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".feature-card");

    const cleanupFns: Array<() => void> = [];

    cards.forEach((card) => {
      const handlePointerMove = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--y", `${event.clientY - rect.top}px`);
      };

      card.addEventListener("pointermove", handlePointerMove);
      cleanupFns.push(() => card.removeEventListener("pointermove", handlePointerMove));
    });

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    const navLinks = document.querySelectorAll<HTMLAnchorElement>(".nav a");

    const handleScroll = () => {
      const current = window.scrollY + 160;

      navSections.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;

        if (
          current >= section.offsetTop &&
          current < section.offsetTop + section.offsetHeight
        ) {
          navLinks.forEach((link) => link.classList.remove("active"));

          const active = document.querySelector<HTMLAnchorElement>(
            `.nav a[href="#${id}"]`
          );

          if (active) active.classList.add("active");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [navSections]);

  function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const business = (form.elements.namedItem("business") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const budget = (form.elements.namedItem("budget") as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim();

    const subject = encodeURIComponent(`New Project Request from ${name}`);

    const body = encodeURIComponent(`Name: ${name}
Business: ${business}
Email: ${email}
Budget: ${budget}

Project Details:
${message}`);

    window.location.href = `mailto:${siteContent.contact.email}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="site">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Medios Accesible Home">
          <img
            className="brand-logo-img"
            src={siteContent.brand.logo}
            alt="Medios Accesible logo"
          />
          <span>{siteContent.brand.name}</span>
        </a>

        <nav className="nav" aria-label="Main navigation">
          <a className="active" href="#home">
            Home
          </a>
          <a href="#services">Services</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="login-btn" href="#portal">
          Client Login ⊗
        </a>
      </header>

      <main>
        <section className="hero" id="home">
          <img className="hero-bg-image" src={siteContent.hero.backgroundImage} alt="" />

          <CodeRain />

          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">{siteContent.hero.eyebrow}</div>

              <h1>
                {siteContent.hero.headlineLines.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
                <span className="gradient-text">{siteContent.hero.highlight}</span>
              </h1>

              <p>
                We build custom-coded websites, digital systems, and client portals that
                help your business grow — with <strong>transparent service</strong> every
                step of the way.
              </p>

              <div className="hero-actions">
                <a className="btn btn-primary" href="#services">
                  {siteContent.hero.primaryButton} <span>→</span>
                </a>

                <a className="btn btn-secondary" href="#portfolio">
                  {siteContent.hero.secondaryButton} <span>&lt;/&gt;</span>
                </a>
              </div>
            </div>
          </div>

          <div className="feature-strip">
            {siteContent.features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="icon">
                  <Icon type={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-arrow">→</span>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="services">
          <div className="tiers-grid">
            <aside className="tiers-copy reveal">
              <div className="kicker">{siteContent.pricingIntro.kicker}</div>
              <h2>{siteContent.pricingIntro.title}</h2>
              <p>{siteContent.pricingIntro.description}</p>
            </aside>

            <div className="pricing-grid">
              {siteContent.pricing.map((plan) => (
                <article
                  className={`price-card reveal ${plan.popular ? "popular" : ""}`}
                  key={plan.name}
                >
                  {plan.popular && <div className="badge">Most Popular</div>}

                  <h3>{plan.name}</h3>
                  <p className="sub">{plan.subtitle}</p>

                  <div className="price">
                    {plan.price} <span>{plan.term}</span>
                  </div>

                  <ul>
                    {plan.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <a className="mini-btn" href="#contact">
                    Get Started →
                  </a>
                </article>
              ))}
            </div>

            <aside className="portal-preview reveal" id="portal">
              <div className="portal-top">
                <strong>‹ Client Portal Preview</strong>
                <span className="live">Live</span>
              </div>

              <div className="portal-columns">
                <div className="progress-block">
                  <div>
                    <div className="meter-label">
                      <span>Project Status</span>
                      <strong>On Track</strong>
                    </div>
                    <div className="bar">
                      <span style={{ width: "75%" }}></span>
                    </div>
                  </div>

                  <div>
                    <div className="meter-label">
                      <span>Hours Used</span>
                      <strong>36 / 50 hrs</strong>
                    </div>
                    <div className="bar">
                      <span style={{ width: "72%" }}></span>
                    </div>
                  </div>

                  <div className="buyout">
                    <span>Current Plan</span>
                    <strong>$300/mo</strong>
                  </div>
                </div>

                <div className="queue">
                  <div className="queue-title">Content Queue</div>

                  <div className="queue-row">
                    <span>Home Page Update</span>
                    <span>In Progress</span>
                  </div>

                  <div className="queue-row">
                    <span>New Service Page</span>
                    <span className="pink">Queued</span>
                  </div>

                  <div className="queue-row">
                    <span>Blog Post: 5 Ways...</span>
                    <span className="gold">Review</span>
                  </div>

                  <div className="queue-row">
                    <span>Case Study Upload</span>
                    <span className="pink">Queued</span>
                  </div>
                </div>
              </div>

              <a className="portal-btn" href="#contact">
                Go to Portal →
              </a>
            </aside>
          </div>
        </section>

        <section className="extra-section" id="portfolio">
          <div className="section-head reveal">
            <div>
              <div className="kicker">Portfolio</div>
              <h2>Custom-coded work that feels alive.</h2>
            </div>

            <p>
              Use this area to showcase client sites, landing pages, dashboards,
              ecommerce builds, ads, visuals, and full digital systems.
            </p>
          </div>

          <div className="service-grid">
            <article className="service-card reveal">
              <div className="service-number">01</div>
              <h3>Animated Landing Pages</h3>
              <p>
                High-impact landing pages with custom motion, premium layout, and
                conversion-focused structure.
              </p>
            </article>

            <article className="service-card reveal">
              <div className="service-number">02</div>
              <h3>Client Portals</h3>
              <p>
                Transparent systems for project status, billing, content queues,
                messages, and active work stages.
              </p>
            </article>

            <article className="service-card reveal">
              <div className="service-number">03</div>
              <h3>Digital Campaigns</h3>
              <p>
                Branded visuals, social content, ad pages, SEO pages, and digital
                growth systems for businesses.
              </p>
            </article>
          </div>
        </section>

        <section className="extra-section" id="blog">
          <div className="section-head reveal">
            <div>
              <div className="kicker">Blog</div>
              <h2>Strategy that builds authority.</h2>
            </div>

            <p>
              Blog pages help your company rank, explain your value, and turn visitors
              into educated leads before they contact you.
            </p>
          </div>

          <div className="service-grid">
            <article className="service-card reveal">
              <div className="service-number">Insight</div>
              <h3>Why custom code beats templates</h3>
              <p>
                Custom code gives your company better control, cleaner structure,
                stronger visuals, and better scalability.
              </p>
            </article>

            <article className="service-card reveal">
              <div className="service-number">Systems</div>
              <h3>How portals create trust</h3>
              <p>
                Client portals give customers transparency, reduce confusion, and make
                your service feel more professional.
              </p>
            </article>

            <article className="service-card reveal">
              <div className="service-number">Growth</div>
              <h3>What makes a site rank better</h3>
              <p>
                Fast structure, service pages, SEO copy, clean headings, and clear
                internal links build a stronger search foundation.
              </p>
            </article>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="contact-inner">
            <aside className="contact-panel reveal">
              <div className="kicker">Contact</div>
              <h2>Ready to build something custom?</h2>
              <p>
                Send your project details and this form will open an email draft
                addressed to Medios Accesible.
              </p>

              <ul className="contact-list">
                <li>Custom-coded websites and landing pages</li>
                <li>Client portals and transparent project systems</li>
                <li>SEO-ready service pages and blog structures</li>
                <li>Digital visuals, ads, and campaign assets</li>
              </ul>
            </aside>

            <form className="contact-form reveal" onSubmit={handleContactSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="name">Name</label>
                  <input id="name" name="name" type="text" placeholder="Your name" required />
                </div>

                <div className="field">
                  <label htmlFor="business">Business</label>
                  <input
                    id="business"
                    name="business"
                    type="text"
                    placeholder="Business name"
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="budget">Budget</label>
                  <input
                    id="budget"
                    name="budget"
                    type="text"
                    placeholder={siteContent.contact.budgetPlaceholder}
                  />
                </div>

                <div className="field full">
                  <label htmlFor="message">Project Details</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell me what you want to build..."
                    required
                  ></textarea>
                </div>

                <div className="field full">
                  <button className="submit" type="submit">
                    Send Project Request →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        © <span>{year}</span> {siteContent.brand.name}. Custom-coded digital experiences.
      </footer>
    </div>
  );
}
