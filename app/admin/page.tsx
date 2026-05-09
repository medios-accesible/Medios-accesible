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

type ClientProject = {
  id: string;
  title: string;
  status: string;
  stage: string;
  progress: number;
  plan: string | null;
  monthly_price: number | null;
  client_id: string;
};

type MessageNotification = {
  id: string;
  project_id: string;
  sender_id: string;
  read_at: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [unreadByClient, setUnreadByClient] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);


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

      setClients((clientsData || []) as Profile[]);

      const { data: projectsData } = await supabase
        .from("client_projects")
        .select("id, title, status, stage, progress, plan, monthly_price, client_id")
        .order("created_at", { ascending: false });

      const loadedProjects = (projectsData || []) as ClientProject[];
      setProjects(loadedProjects);

      const projectIds = loadedProjects.map((project) => project.id);
      const nextUnreadByClient: Record<string, number> = {};

      if (projectIds.length > 0) {
        const { data: unreadData } = await supabase
          .from("messages")
          .select("id, project_id, sender_id, read_at")
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
      }

      setUnreadByClient(nextUnreadByClient);
      setTotalUnread(
        Object.values(nextUnreadByClient).reduce((sum, count) => sum + count, 0)
      );

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
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading admin dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Admin Dashboard</p>
            <h1>Medios Accesible Admin</h1>
            <p>{adminProfile?.email}</p>

            {totalUnread > 0 && (
              <div className="notification-summary">
                {totalUnread} unread client message{totalUnread === 1 ? "" : "s"}
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
            <h2>
              Clients
              {totalUnread > 0 && <span className="notification-badge">{totalUnread}</span>}
            </h2>

            {clients.length === 0 ? (
              <p>No client accounts yet.</p>
            ) : (
              <div className="portal-list">
                {clients.map((client) => {
                  const unreadCount = unreadByClient[client.id] || 0;

                  return (
                    <Link
                      className="portal-list-item portal-clickable"
                      href={`/admin/clients/${client.id}`}
                      key={client.id}
                    >
                      <div>
                        <h3>
                          {client.full_name || client.company_name || "Client"}
                          {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                          )}
                        </h3>
                        <p>{client.email}</p>
                      </div>
                      <span>{unreadCount > 0 ? `${unreadCount} New` : "Open →"}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="portal-actions">
              <Link className="portal-link" href="/admin/clients">
                View All Clients →
              </Link>
            </div>
          </article>

          <article className="portal-card">
            <h2>Projects</h2>

            {projects.length === 0 ? (
              <p>No projects created yet.</p>
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
            <h2>Blog Manager</h2>
            <p>
              Create, update, delete, publish, upload backgrounds, and control the 3 blog previews on the homepage.
            </p>

            <div className="portal-actions">
              <Link className="portal-link" href="/admin/blogs">
                Manage Blogs →
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
