"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "admin" | "client";
};

type ClientProject = {
  id: string;
  title: string;
  status: string;
  stage: string;
  progress: number;
  plan: string | null;
  monthly_price: number | null;
  client_id: string;
  created_at?: string;
};

type MessageNotification = {
  id: string;
  project_id: string;
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

type ProjectUpdate = {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  update_type: string;
  created_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Not updated";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [unreadByClient, setUnreadByClient] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const monthlyTotal = useMemo(() => {
    return projects.reduce((sum, project) => sum + Number(project.monthly_price || 0), 0);
  }, [projects]);

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
    async function loadAdminDashboard() {
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

      if (!profileData || profileData.role !== "admin") {
        router.push("/client");
        return;
      }

      setAdminProfile(profileData as Profile);

      const { data: clientsData } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, role")
        .eq("role", "client")
        .order("created_at", { ascending: false });

      const loadedClients = (clientsData || []) as Profile[];
      setClients(loadedClients);

      const { data: projectsData } = await supabase
        .from("client_projects")
        .select("id, title, status, stage, progress, plan, monthly_price, client_id, created_at")
        .order("created_at", { ascending: false });

      const loadedProjects = (projectsData || []) as ClientProject[];
      setProjects(loadedProjects);

      const projectIds = loadedProjects.map((project) => project.id);
      const nextUnreadByClient: Record<string, number> = {};

      if (projectIds.length > 0) {
        const { data: unreadData } = await supabase
          .from("messages")
          .select("id, project_id, sender_id, read_at, created_at")
          .in("project_id", projectIds)
          .is("read_at", null)
          .neq("sender_id", userId);

        const unreadMessages = (unreadData || []) as MessageNotification[];

        unreadMessages.forEach((message) => {
          const project = loadedProjects.find((item) => item.id === message.project_id);
          if (!project) return;

          nextUnreadByClient[project.client_id] =
            (nextUnreadByClient[project.client_id] || 0) + 1;
        });

        const { data: updateData } = await supabase
          .from("project_updates")
          .select("id, project_id, title, summary, update_type, created_at")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(6);

        setUpdates((updateData || []) as ProjectUpdate[]);
      }

      setUnreadByClient(nextUnreadByClient);
      setTotalUnread(Object.values(nextUnreadByClient).reduce((sum, count) => sum + count, 0));

      setLoading(false);
    }

    loadAdminDashboard();
  }, [router]);

  async function handleSignOut() {
    await supabase
      .from("developer_presence")
      .update({
        is_logged_in: false,
        last_seen_at: new Date().toISOString()
      })
      .eq("id", "main");

    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="portal-dashboard-page">
        <section className="portal-dashboard-loading">
          <p>Loading admin dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-dashboard-page admin-portal-dashboard">
      <aside className="portal-sidebar">
        <Link className="portal-sidebar-brand" href="/">
          <div className="portal-brand-mark">MA</div>
          <div>
            <strong>Medios Admin</strong>
            <span>Command Center</span>
          </div>
        </Link>

        <nav className="portal-sidebar-nav">
          <Link className="active" href="/admin">
            <span>▦</span> Dashboard
          </Link>
          <Link href="/admin/clients">
            <span>□</span> Clients
            {totalUnread > 0 && <b>{totalUnread}</b>}
          </Link>
          <Link href="/admin/blogs">
            <span>✎</span> Blogs
          </Link>
          <Link href="/admin/services">
            <span>◇</span> Services
          </Link>
          <a href="#projects">
            <span>▱</span> Projects
          </a>
          <a href="#updates">
            <span>◎</span> Updates
          </a>
          <a href="#settings">
            <span>⚙</span> Settings
          </a>
        </nav>

        <div className="portal-sidebar-actions">
          <p>Admin Actions</p>

          <Link href="/admin/clients">
            <span>＋</span> Client Workspace
          </Link>

          <Link href="/admin/blogs">
            <span>✎</span> New Blog
          </Link>

          <Link href="/admin/services">
            <span>◇</span> Edit Pricing
          </Link>
        </div>

        <div className="portal-sidebar-help">
          <p>Developer status</p>
          <span>Showing as at desk while signed in.</span>
          <a href="/">View Website</a>
        </div>
      </aside>

      <section className="portal-dashboard-main">
        <header className="portal-dashboard-header">
          <div>
            <p>Welcome back,</p>
            <h1>Admin <span>⚡</span></h1>
            <span>{adminProfile?.email}</span>
          </div>

          <div className="portal-header-actions">
            <Link className="portal-top-button is-home" href="/">
              ⌂ Home
            </Link>

            <button className="portal-top-button" onClick={handleSignOut}>
              ⎋ Sign Out →
            </button>
          </div>
        </header>

        <div className="portal-stat-grid admin-stat-grid">
          <article className="portal-stat-card">
            <div className="portal-stat-icon">□</div>
            <div>
              <span>Clients</span>
              <strong>{clients.length}</strong>
              <p><i></i> Active client accounts</p>
            </div>
          </article>

          <article className="portal-stat-card">
            <div className="portal-stat-icon">▱</div>
            <div>
              <span>Projects</span>
              <strong>{projects.length}</strong>
              <p><i></i> Project records</p>
            </div>
          </article>

          <article className="portal-stat-card">
            <div className="portal-stat-icon">☵</div>
            <div>
              <span>Messages</span>
              <strong>{totalUnread}</strong>
              <p><i></i> Unread client messages</p>
            </div>
          </article>

          <article className="portal-stat-card">
            <div className="portal-stat-icon">▣</div>
            <div>
              <span>Monthly Value</span>
              <strong>${monthlyTotal}</strong>
              <p><i></i> Active project billing</p>
            </div>
          </article>
        </div>

        <div className="portal-content-grid">
          <div className="portal-left-column">
            <article className="portal-dashboard-panel">
              <div className="portal-panel-head">
                <h2>Client Workspaces</h2>
                <Link href="/admin/clients">View all clients →</Link>
              </div>

              {clients.length === 0 ? (
                <p>No client accounts yet.</p>
              ) : (
                <div className="admin-client-list">
                  {clients.slice(0, 5).map((client) => {
                    const unreadCount = unreadByClient[client.id] || 0;

                    return (
                      <Link href={`/admin/clients/${client.id}`} className="admin-client-row" key={client.id}>
                        <div className="portal-avatar">
                          {(client.full_name || client.company_name || client.email || "C").slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <strong>{client.full_name || client.company_name || "Client"}</strong>
                          <p>{client.email}</p>
                        </div>

                        <span>{unreadCount > 0 ? `${unreadCount} New` : "Open →"}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="portal-dashboard-panel" id="projects">
              <div className="portal-panel-head">
                <h2>Active Projects</h2>
                <Link href="/admin/clients">Manage projects →</Link>
              </div>

              <div className="admin-project-list">
                {projects.slice(0, 4).map((project) => (
                  <div className="client-active-project-card admin-project-card" key={project.id}>
                    <div className="client-project-header">
                      <div className="client-project-logo">◎</div>

                      <div>
                        <h3>{project.title}</h3>
                        <p>{project.stage}</p>
                      </div>

                      <span className="portal-status-pill">{project.status}</span>
                    </div>

                    <div className="client-project-progress-area">
                      <div>
                        <span>Progress</span>
                        <strong>{project.progress}%</strong>
                      </div>

                      <div className="portal-progress-bar">
                        <span style={{ width: `${project.progress}%` }}></span>
                      </div>
                    </div>

                    <div className="project-data-grid">
                      <div>
                        <span>Current Plan</span>
                        <strong>
                          {project.monthly_price ? `$${project.monthly_price}/mo` : project.plan || "Active"}
                        </strong>
                      </div>

                      <div>
                        <span>Last Updated</span>
                        <strong>{formatDate(project.created_at)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="portal-right-column">
            <article className="portal-dashboard-panel" id="updates">
              <div className="portal-panel-head">
                <h2>Recent Updates</h2>
                <Link href="/admin/clients">Post update →</Link>
              </div>

              {updates.length === 0 ? (
                <p>No project updates posted yet.</p>
              ) : (
                <div className="portal-admin-update-list">
                  {updates.map((update) => (
                    <div className="portal-update-card compact" key={update.id}>
                      <div className="portal-update-meta">
                        <span>{update.update_type}</span>
                        <time>{formatDate(update.created_at)}</time>
                      </div>

                      <h3>{update.title}</h3>
                      <p>{update.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="portal-dashboard-panel">
              <h2>Content Tools</h2>

              <div className="portal-tool-list">
                <Link href="/admin/blogs">
                  <span>✎</span>
                  <div>
                    <strong>Blog Manager</strong>
                    <p>Create, edit, publish, and feature posts.</p>
                  </div>
                </Link>

                <Link href="/admin/services">
                  <span>◇</span>
                  <div>
                    <strong>Service Manager</strong>
                    <p>Edit packages, add-ons, and pricing.</p>
                  </div>
                </Link>

                <Link href="/portfolio">
                  <span>▦</span>
                  <div>
                    <strong>Portfolio Page</strong>
                    <p>Review public project showcase.</p>
                  </div>
                </Link>
              </div>
            </article>
          </aside>
        </div>

        <footer className="portal-dashboard-footer">
          © 2026 Medios Accesible. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
