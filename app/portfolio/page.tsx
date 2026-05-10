"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CodeRain from "../../components/CodeRain";
import { siteContent } from "../../data/siteContent";

type PortfolioProject = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  url: string;
};

const projects: PortfolioProject[] = [
  {
    id: 1,
    title: "Elevate Fitness",
    category: "Website",
    description:
      "A modern, high-performance website for a fitness brand to drive sign-ups and showcase programs.",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 2,
    title: "Vertex Logistics",
    category: "Website",
    description:
      "A professional logistics website built to showcase services, build trust, and convert enterprise clients.",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 3,
    title: "Haven Property Group",
    category: "Website",
    description:
      "A sleek real estate website built to highlight listings and generate quality leads.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 4,
    title: "Spark Commerce",
    category: "E-Commerce",
    description:
      "A custom e-commerce store with a seamless shopping experience and secure checkout.",
    image:
      "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 5,
    title: "MedPro Dashboard",
    category: "Dashboard",
    description:
      "A custom dashboard that gives real-time insights and simplifies data management.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 6,
    title: "BrightPath Learning",
    category: "Website",
    description:
      "An engaging website for an educational platform focused on accessibility and student success.",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 7,
    title: "ConstructCo",
    category: "Website",
    description:
      "A bold website for a construction company to showcase projects and build credibility.",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 8,
    title: "TaskFlow App",
    category: "Web Application",
    description:
      "A custom web application that helps teams manage tasks, projects, and productivity.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  },
  {
    id: 9,
    title: "Nexa Security",
    category: "Website",
    description:
      "A modern website for a security company to highlight solutions and build trust.",
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1400&q=80",
    url: "#"
  }
];

const filters = [
  "All Projects",
  "Websites",
  "Client Portals",
  "Web Applications",
  "E-Commerce",
  "Dashboards"
];

function matchesFilter(project: PortfolioProject, filter: string) {
  if (filter === "All Projects") return true;
  if (filter === "Websites") return project.category === "Website";
  if (filter === "Client Portals") return project.category === "Client Portal";
  if (filter === "Web Applications") return project.category === "Web Application";
  if (filter === "E-Commerce") return project.category === "E-Commerce";
  if (filter === "Dashboards") return project.category === "Dashboard";
  return true;
}

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState("All Projects");

  const visibleProjects = useMemo(
    () => projects.filter((project) => matchesFilter(project, activeFilter)),
    [activeFilter]
  );

  return (
    <main className="portfolio-revamp-page">
      <header className="site-header portfolio-revamp-header">
        <Link className="brand" href="/" aria-label="Medios Accesible Home">
          <img
            className="brand-logo-img"
            src={siteContent.brand.logo}
            alt="Medios Accesible logo"
          />
          <span>{siteContent.brand.name}</span>
        </Link>

        <nav className="nav" aria-label="Portfolio navigation">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link className="active" href="/portfolio">Portfolio</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <Link className="login-btn" href="/login">
          Open Portal ⊗
        </Link>
      </header>

      <section className="portfolio-hero-revamp">
        <img className="hero-bg-image portfolio-hero-art" src={siteContent.hero.backgroundImage} alt="" />
        <CodeRain className="hero-canvas portfolio-code-canvas" />

        <div className="portfolio-hero-glow one"></div>
        <div className="portfolio-hero-glow two"></div>

        <div className="portfolio-hero-content">
          <div className="eyebrow">Custom code. Clear systems. Real growth.</div>

          <h1>
            Our <span className="gradient-text">Work.</span>
            <br />
            Real <span className="gradient-text">Results.</span>
          </h1>

          <p>
            Explore a selection of custom websites, systems, and client portals
            we have built to help businesses grow, operate, and stand out online.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-primary" href="/contact">
              Start a Project <span>→</span>
            </Link>

            <Link className="btn btn-secondary" href="/services">
              View All Services <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="portfolio-project-section">
        <div className="portfolio-filter-bar" aria-label="Portfolio filters">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter ? "active" : ""}
              type="button"
              key={filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="portfolio-grid-revamp">
          {visibleProjects.map((project, index) => (
            <article
              className="portfolio-card-revamp"
              style={{ "--delay": `${index * 65}ms` } as React.CSSProperties}
              key={project.id}
            >
              <div className="portfolio-image-wrap">
                <img src={project.image} alt="" />
              </div>

              <div className="portfolio-card-copy">
                <div className="portfolio-card-title-row">
                  <h2>{project.title}</h2>
                  <span>{project.category}</span>
                </div>

                <p>{project.description}</p>

                <a href={project.url} target="_blank" rel="noreferrer">
                  View Project <span>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-cta-revamp">
        <div className="portfolio-cta-line-art"></div>

        <div>
          <div className="kicker">Ready to build something great?</div>
          <h2>Let’s build your next project.</h2>
          <p>We build custom solutions that drive real results.</p>
        </div>

        <Link className="btn btn-primary" href="/contact">
          Get in Touch <span>→</span>
        </Link>
      </section>

      <footer className="portfolio-footer-revamp">
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
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div>
          <h3>Services</h3>
          <Link href="/services">Custom Website Development</Link>
          <Link href="/services">Client Portals & Dashboards</Link>
          <Link href="/services">Database Design & Integration</Link>
          <Link href="/services">Support & Consulting</Link>
        </div>

        <div>
          <h3>Connect</h3>
          <a href="mailto:mediosaccesible@gmail.com">mediosaccesible@gmail.com</a>
          <a href="tel:+17879074302">(787) 907-4302</a>
        </div>
      </footer>
    </main>
  );
}
