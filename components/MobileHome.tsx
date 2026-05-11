"use client";

import Link from "next/link";
import CodeRain from "./CodeRain";
import { siteContent } from "../data/siteContent";

const mobileHero =
  "https://res.cloudinary.com/dovrzmlqj/image/upload/v1778475871/hero-my-site-mobile_dtccoq.png";

const portfolioCards = [
  {
    title: "Neon Commerce",
    type: "E-Commerce",
    image:
      "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Client Portal",
    type: "Dashboard",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Growth Website",
    type: "Website",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80"
  }
];

const blogCards = [
  {
    title: "Why custom code makes your brand feel premium",
    category: "Strategy",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "How a client portal builds trust",
    category: "Systems",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Simple SEO wins for service businesses",
    category: "SEO",
    image:
      "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?auto=format&fit=crop&w=900&q=80"
  }
];

export default function MobileHome() {
  return (
    <main className="mobile-home-page">
      <section className="mobile-hero-shell" id="home">
        <img className="mobile-hero-bg" src={mobileHero} alt="" />
        <CodeRain className="mobile-code-rain" />

        <div className="mobile-hero-copy">
          <span className="mobile-kicker">{siteContent.hero.eyebrow}</span>
          <h1>
            Your business deserves more than <strong>a template.</strong>
          </h1>
          <p>{siteContent.hero.description}</p>

          <div className="mobile-hero-actions">
            <Link className="mobile-primary-btn" href="/services">
              View Services <span>→</span>
            </Link>
            <Link className="mobile-ghost-btn" href="/portfolio">
              See Work
            </Link>
          </div>
        </div>
      </section>

      <section className="mobile-section mobile-feature-strip">
        <div className="mobile-section-heading">
          <span>What we build</span>
          <h2>Custom digital systems that feel alive.</h2>
        </div>

        <div className="mobile-feature-grid">
          {siteContent.features.slice(0, 4).map((feature) => (
            <article className="mobile-feature-card" key={feature.title}>
              <div className="mobile-card-icon">✦</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mobile-section mobile-plans-section">
        <div className="mobile-section-heading">
          <span>{siteContent.pricingIntro.kicker}</span>
          <h2>{siteContent.pricingIntro.title}</h2>
          <p>{siteContent.pricingIntro.description}</p>
        </div>

        <div className="mobile-horizontal-scroll" aria-label="Service plans">
          {siteContent.pricing.map((plan) => (
            <article className="mobile-plan-card" key={plan.name}>
              {plan.popular && <span className="mobile-popular-badge">Popular</span>}
              <h3>{plan.name}</h3>
              <p>{plan.subtitle}</p>
              <strong>
                {plan.price}
                <small>{plan.term}</small>
              </strong>
              <ul>
                {plan.items.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href="/services">View Plan →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mobile-section mobile-portfolio-preview">
        <div className="mobile-section-heading split">
          <div>
            <span>Portfolio</span>
            <h2>Recent style direction.</h2>
          </div>
          <Link href="/portfolio">View all</Link>
        </div>

        <div className="mobile-horizontal-scroll" aria-label="Portfolio previews">
          {portfolioCards.map((project) => (
            <article className="mobile-image-card" key={project.title}>
              <img src={project.image} alt="" />
              <div>
                <span>{project.type}</span>
                <h3>{project.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mobile-section mobile-portal-preview-card">
        <span>Client Portal</span>
        <h2>Transparency after launch.</h2>
        <p>
          Clients can track project stages, requests, messages, updates, and active
          support from one clean portal experience.
        </p>

        <div className="mobile-portal-metrics">
          <div>
            <strong>82%</strong>
            <span>Project progress</span>
          </div>
          <div>
            <strong>Live</strong>
            <span>Developer status</span>
          </div>
        </div>

        <Link className="mobile-primary-btn" href="/login">
          Open Portal <span>→</span>
        </Link>
      </section>

      <section className="mobile-section mobile-blog-preview">
        <div className="mobile-section-heading split">
          <div>
            <span>Blog</span>
            <h2>Ideas for growth.</h2>
          </div>
          <Link href="/blog">Read</Link>
        </div>

        <div className="mobile-blog-list">
          {blogCards.map((blog) => (
            <article className="mobile-blog-card" key={blog.title}>
              <img src={blog.image} alt="" />
              <div>
                <span>{blog.category}</span>
                <h3>{blog.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mobile-section mobile-contact-cta">
        <span>Ready?</span>
        <h2>Let&apos;s build something custom for your business.</h2>
        <p>
          Email us or start with the contact form. We&apos;ll map the best plan before
          anything is built.
        </p>
        <Link className="mobile-primary-btn" href="/contact">
          Start a Project <span>→</span>
        </Link>
      </section>

      <footer className="mobile-footer">
        <strong className="mobile-footer-brand">Medios Accesible</strong>
        <p>Custom code. Clear systems. Real growth.</p>
        <div>
          <Link href="/services">Services</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
}
