"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  background_url: string | null;
  created_at: string;
};

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      const { data } = await supabase
        .from("blogs")
        .select("id, title, slug, excerpt, category, background_url, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      setBlogs((data || []) as Blog[]);
      setLoading(false);
    }

    loadBlogs();
  }, []);

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <Link className="portal-link" href="/">
          ← Home
        </Link>

        <div>
          <p className="portal-kicker">Medios Accesible Blog</p>
          <h1>Digital strategy, websites, content, and systems.</h1>
          <p>
            Practical articles about websites, SEO, client portals, marketing systems,
            ecommerce, and content strategy.
          </p>
        </div>
      </section>

      <section className="blog-list-section">
        {loading ? (
          <article className="portal-card">
            <p>Loading blogs...</p>
          </article>
        ) : blogs.length === 0 ? (
          <article className="portal-card">
            <p>No blogs have been published yet.</p>
          </article>
        ) : (
          <div className="blog-grid">
            {blogs.map((blog) => (
              <Link className="blog-card" href={`/blog/${blog.slug}`} key={blog.id}>
                {blog.background_url && (
                  <img className="blog-card-bg" src={blog.background_url} alt="" />
                )}

                <div className="blog-card-content">
                  <span>{blog.category || "Blog"}</span>
                  <h2>{blog.title}</h2>
                  <p>{blog.excerpt || "Read the full article."}</p>
                  <strong>Read More →</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
