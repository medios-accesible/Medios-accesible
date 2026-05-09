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

type MessageNotification = {
  id: string;
  project_id: string;
  sender_id: string;
  read_at: string | null;
};

export default function ClientDashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
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

      const loadedProjects = (projectData || []) as Project[];
      setProjects(loadedProjects);

      const projectIds = loadedProjects.map((project) => project.id);

      if (projectIds.length > 0) {
        const { data: unreadData } = await supabase
          .from("messages")
          .select("id, project_id, sender_id, read_at")
          .in("project_id", projectIds)
          .is("read_at", null)
          .neq("sender_id", userId);

        setUnreadMessages(((unreadData || []) as MessageNotification[]).length);
      } else {
        setUnreadMessages(0);
      }

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

            {unreadMessages > 0 && (
              <div className="notification-summary">
                {unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}
              </div>
            )}
          </div>

          <div className="portal-header-actions">
            <Link className="portal-link" href="/">
              Home
            </Link>

            <button onClick={handleSignOut}>Sign Out</button>
          </div>
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
            <h2>
              Messages
              {unreadMessages > 0 && (
                <span className="notification-badge">{unreadMessages}</span>
              )}
            </h2>
            <p>Send project questions, updates, approvals, and requests directly to Medios Accesible.</p>

            <div className="portal-actions">
              <Link className="portal-link" href="/client/messages">
                {unreadMessages > 0
                  ? `Open Messages (${unreadMessages} New) →`
                  : "Open Messages →"}
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
