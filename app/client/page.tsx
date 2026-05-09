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

type DeveloperPresence = {
  id: string;
  is_logged_in: boolean | null;
  last_seen_at: string | null;
};

export default function ClientDashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [developerAtDesk, setDeveloperAtDesk] = useState(false);
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

      const { data: presenceData } = await supabase
        .from("developer_presence")
        .select("id, is_logged_in, last_seen_at")
        .eq("id", "main")
        .maybeSingle();

      const presence = presenceData as DeveloperPresence | null;
      setDeveloperAtDesk(Boolean(presence?.is_logged_in));

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

          <article className={`portal-card developer-status-card ${developerAtDesk ? "is-online" : "is-away"}`}>
            <h2>Developer Status</h2>

            <div className="developer-status-line">
              <span className="developer-status-dot"></span>
              <strong>{developerAtDesk ? "At desk" : "Away from desk"}</strong>
            </div>

            <p>
              {developerAtDesk
                ? "The developer is currently at his desk. Message me in your client portal for the fastest response."
                : "The developer is currently away from his desk. Please call or send email for a timely response."}
            </p>

            <div className="portal-actions">
              {developerAtDesk ? (
                <Link className="portal-link" href="/client/messages">
                  Message Me →
                </Link>
              ) : (
                <a className="portal-link" href="mailto:mediosaccesible@gmail.com">
                  Send Email →
                </a>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
