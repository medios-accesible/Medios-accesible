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
  site_url: string | null;
};

type MessageNotification = {
  id: string;
  project_id: string;
  sender_id: string;
  read_at: string | null;
};

type ProjectUpdate = {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  update_type: string;
  current_stage: string | null;
  progress_snapshot: number | null;
  completed_work: string | null;
  next_steps: string | null;
  client_action_needed: string | null;
  blockers: string | null;
  estimated_completion: string | null;
  created_at: string;
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
  const [latestUpdates, setLatestUpdates] = useState<ProjectUpdate[]>([]);
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
        .select("id, title, status, stage, progress, plan, monthly_price, site_url")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      const loadedProjects = (projectData || []) as Project[];
      setProjects(loadedProjects);

      const projectIds = loadedProjects.map((project) => project.id);

      if (projectIds.length > 0) {
        const { data: updateData } = await supabase
          .from("project_updates")
          .select(
            "id, project_id, title, summary, update_type, current_stage, progress_snapshot, completed_work, next_steps, client_action_needed, blockers, estimated_completion, created_at"
          )
          .in("project_id", projectIds)
          .eq("is_visible_to_client", true)
          .order("created_at", { ascending: false })
          .limit(3);

        setLatestUpdates((updateData || []) as ProjectUpdate[]);
      } else {
        setLatestUpdates([]);
      }

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
              <div className="client-project-stack">
                {projects.map((project) => {
                  const projectUpdates = latestUpdates.filter(
                    (update) => update.project_id === project.id
                  );
                  const primaryUpdate = projectUpdates[0];

                  return (
                    <div className="client-project-portal-preview" key={project.id}>
                      <div className="portal-top">
                        <strong>‹ {project.title}</strong>
                        <span className="live">{project.status}</span>
                      </div>

                      <div className="portal-columns">
                        <div className="progress-block">
                          <div>
                            <div className="meter-label">
                              <span>Project Status</span>
                              <strong>{project.stage}</strong>
                            </div>
                            <div className="bar">
                              <span style={{ width: `${project.progress}%` }}></span>
                            </div>
                          </div>

                          <div>
                            <div className="meter-label">
                              <span>Progress Complete</span>
                              <strong>{project.progress}%</strong>
                            </div>
                            <div className="bar">
                              <span style={{ width: `${project.progress}%` }}></span>
                            </div>
                          </div>

                          <div className="buyout">
                            <span>Current Plan</span>
                            <strong>
                              {project.monthly_price
                                ? `$${project.monthly_price}/mo`
                                : project.plan || "Active"}
                            </strong>
                          </div>

                          <div className="buyout">
                            <span>Preview Link</span>
                            <strong>{project.site_url ? "Ready" : "Pending"}</strong>
                          </div>
                        </div>

                        <div className="queue">
                          <div className="queue-title">Update Queue</div>

                          <div className="queue-row">
                            <span>{primaryUpdate?.title || "Project Update"}</span>
                            <span>{primaryUpdate?.update_type || project.stage}</span>
                          </div>

                          <div className="queue-row">
                            <span>Completed Work</span>
                            <span className="pink">
                              {primaryUpdate?.completed_work ? "Updated" : "Pending"}
                            </span>
                          </div>

                          <div className="queue-row">
                            <span>Next Steps</span>
                            <span className="gold">
                              {primaryUpdate?.next_steps ? "Posted" : "Waiting"}
                            </span>
                          </div>

                          <div className="queue-row">
                            <span>Client Action</span>
                            <span className="pink">
                              {primaryUpdate?.client_action_needed ? "Needed" : "None"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {primaryUpdate && (
                        <div className="client-project-preview-update">
                          <h3>{primaryUpdate.title}</h3>
                          <p>{primaryUpdate.summary}</p>

                          {primaryUpdate.completed_work && (
                            <div className="project-update-detail">
                              <strong>Completed:</strong>
                              <p>{primaryUpdate.completed_work}</p>
                            </div>
                          )}

                          {primaryUpdate.next_steps && (
                            <div className="project-update-detail">
                              <strong>Next:</strong>
                              <p>{primaryUpdate.next_steps}</p>
                            </div>
                          )}

                          {primaryUpdate.client_action_needed && (
                            <div className="project-update-detail highlight">
                              <strong>Action needed from you:</strong>
                              <p>{primaryUpdate.client_action_needed}</p>
                            </div>
                          )}

                          {primaryUpdate.blockers && (
                            <div className="project-update-detail warning">
                              <strong>Blockers:</strong>
                              <p>{primaryUpdate.blockers}</p>
                            </div>
                          )}

                          {primaryUpdate.estimated_completion && (
                            <div className="project-update-detail">
                              <strong>Timing:</strong>
                              <p>{primaryUpdate.estimated_completion}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="client-project-actions">
                        {project.site_url ? (
                          <a
                            className="portal-btn"
                            href={project.site_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Site Preview ↗
                          </a>
                        ) : (
                          <span className="project-link-muted">
                            Site preview link has not been added yet.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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

          <article className="portal-card project-updates-card">
            <h2>Project Updates</h2>

            {latestUpdates.length === 0 ? (
              <p>No detailed project updates have been posted yet.</p>
            ) : (
              <div className="project-updates-list">
                {latestUpdates.map((update) => (
                  <div className="project-update-item" key={update.id}>
                    <div className="project-update-meta">
                      <span>{update.update_type}</span>
                      <time>{new Date(update.created_at).toLocaleDateString()}</time>
                    </div>

                    <h3>{update.title}</h3>
                    <p>{update.summary}</p>

                    {update.completed_work && (
                      <div className="project-update-detail">
                        <strong>Completed:</strong>
                        <p>{update.completed_work}</p>
                      </div>
                    )}

                    {update.next_steps && (
                      <div className="project-update-detail">
                        <strong>Next:</strong>
                        <p>{update.next_steps}</p>
                      </div>
                    )}

                    {update.client_action_needed && (
                      <div className="project-update-detail highlight">
                        <strong>Action needed from you:</strong>
                        <p>{update.client_action_needed}</p>
                      </div>
                    )}

                    {update.blockers && (
                      <div className="project-update-detail warning">
                        <strong>Blockers:</strong>
                        <p>{update.blockers}</p>
                      </div>
                    )}

                    {update.estimated_completion && (
                      <div className="project-update-detail">
                        <strong>Timing:</strong>
                        <p>{update.estimated_completion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                <>
                  <a className="portal-link" href="tel:+17879074302">
                    Call (787) 907-4302
                  </a>

                  <a className="portal-link" href="mailto:mediosaccesible@gmail.com">
                    Send Email →
                  </a>
                </>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
