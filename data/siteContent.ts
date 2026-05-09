export const siteContent = {
  brand: {
    name: "Medios Accesible",
    logo: "https://res.cloudinary.com/dovrzmlqj/image/upload/v1778281428/my-company-logo_gavksa.png"
  },

  hero: {
    backgroundImage:
      "https://res.cloudinary.com/dovrzmlqj/image/upload/v1778278449/hero-my-site_rbvcwr.png",
    eyebrow: "Custom code. Clear systems. Real growth.",
    headlineLines: ["Your", "business", "deserves", "more than"],
    highlight: "a template.",
    description:
      "We build custom-coded websites, digital systems, and client portals that help your business grow — with transparent service every step of the way.",
    primaryButton: "View Services",
    secondaryButton: "See Custom-Coded Work"
  },

  features: [
    {
      title: "Custom-Coded Websites",
      description: "Hand-coded for speed, security, and limitless possibilities.",
      icon: "website"
    },
    {
      title: "Client Portal",
      description: "Track projects, submit requests, and stay in the loop.",
      icon: "client"
    },
    {
      title: "E-Commerce Stores",
      description: "Creating custom online stores that match your brand.",
      icon: "shopping-bag"
    },
    {
      title: "Transparent Process",
      description: "Clear communication, real-time updates, complete transparency.",
      icon: "eye"
    },
    {
      title: "Admin Systems",
      description: "Powerful dashboards and tools to run your business efficiently.",
      icon: "chart"
    },
    {
      title: "Immersive Visuals",
      description: "Engaging, interactive experiences that leave a lasting impression.",
      icon: "cube"
    }
  ],

  pricingIntro: {
    kicker: "Service Tiers",
    title: "Solutions for every stage of your growth.",
    description:
      "Choose the perfect monthly plan to launch, scale, and elevate your digital presence with custom-coded support."
  },

  pricing: [
    {
      name: "Launch",
      subtitle: "Perfect for getting started",
      price: "$100",
      term: "/ Month",
      popular: false,
      items: [
        "Basic website updates",
        "Monthly maintenance",
        "Basic SEO checkup",
        "Email support"
      ]
    },
    {
      name: "Grow",
      subtitle: "Built for growing businesses",
      price: "$300",
      term: "/ Month",
      popular: true,
      items: [
        "Website updates",
        "SEO improvements",
        "Content support",
        "Monthly performance review"
      ]
    },
    {
      name: "Scale",
      subtitle: "Advanced. Powerful. Scalable.",
      price: "$600",
      term: "/ Month",
      popular: false,
      items: [
        "Advanced website management",
        "SEO and content strategy",
        "Landing page updates",
        "Priority support"
      ]
    },
    {
      name: "Full Online Management",
      subtitle: "For businesses that want everything handled",
      price: "$999",
      term: "/ Month",
      popular: false,
      items: [
        "Website management",
        "SEO and blog support",
        "Digital content updates",
        "Priority online support"
      ]
    }
  ],

  contact: {
    email: "crovexai@gmail.com",
    budgetPlaceholder: "$100/mo - $999/mo"
  }
} as const;

export type FeatureIcon = (typeof siteContent.features)[number]["icon"];
