"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "admin" | "client";
};

type Project = {
  id: string;
  title: string;
  status: string;
  stage: string;
  progress: number;
  plan: string | null;
  monthly_price: number | null;
};

export default function ClientDashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, role")
        .eq("id", userId)
        .single();

      if (!profileData) {
        router.push("/login");
        return;
      }

      if (profileData.role === "admin") {
        router.push("/admin");
        return;
      }

      setProfile(profileData as Profile);

      const { data: projectData } = await supabase
        .from("client_projects")
        .select("id, title, status, stage, progress, plan, monthly_price")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      setProjects((projectData || []) as Project[]);
      setLoading(false);
    }

    loadClientDashboard();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading client dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Client Portal</p>
            <h1>Welcome, {profile?.full_name || profile?.company_name || "Client"}</h1>
            <p>{profile?.email}</p>
          </div>

          <button onClick={handleSignOut}>Sign Out</button>
        </header>

        <div className="portal-grid">
          <article className="portal-card">
            <h2>Your Projects</h2>

            {projects.length === 0 ? (
              <p>No projects have been assigned yet.</p>
            ) : (
              <div className="portal-list">
                {projects.map((project) => (
                  <div className="portal-list-item" key={project.id}>
                    <div>
                      <h3>{project.title}</h3>
                      <p>
                        {project.stage} · {project.status}
                      </p>
                    </div>

                    <strong>{project.progress}%</strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="portal-card">
            <h2>Messages</h2>
            <p>Send project questions, updates, approvals, and requests directly to Medios Accesible.</p>

            <div className="portal-actions">
              <Link className="portal-link" href="/client/messages">
                Open Messages →
              </Link>
            </div>
          </article>

          <article className="portal-card">
            <h2>Billing</h2>
            <p>Invoices and payment links will appear here.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
