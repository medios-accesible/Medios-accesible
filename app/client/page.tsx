"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ClientMobileNav from "../../components/ClientMobileNav";
import ClientTutorial from "../../components/ClientTutorial";
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
  created_at?: string;
};

type MessageNotification = {
  id: string;
  project_id: string;
  sender_id: string;
  body?: string | null;
  read_at: string | null;
  created_at: string;
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

function formatDate(value?: string | null) {
  if (!value) return "Not updated yet";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function getGreetingName(profile: Profile | null) {
  return profile?.full_name || profile?.company_name || "Client";
}

export default function ClientDashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<ProjectUpdate[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<MessageNotification[]>([]);
  const [developerAtDesk, setDeveloperAtDesk] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeProject = projects[0] || null;
  const primaryUpdate = latestUpdates[0] || null;

  const monthlyTotal = useMemo(() => {
    return projects.reduce((sum, project) => sum + Number(project.monthly_price || 0), 0);
  }, [projects]);

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
        .select("id, title, status, stage, progress, plan, monthly_price, site_url, created_at")
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
          .limit(6);

        setLatestUpdates((updateData || []) as ProjectUpdate[]);

        const { data: messageData } = await supabase
          .from("messages")
          .select("id, project_id, sender_id, body, read_at, created_at")
          .in("project_id", projectIds)
          .is("read_at", null)
          .neq("sender_id", userId)
          .order("created_at", { ascending: false })
          .limit(8);

        setUnreadMessages((messageData || []) as MessageNotification[]);
      } else {
        setLatestUpdates([]);
        setUnreadMessages([]);
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
      <main className="client-app-page">
        <section className="client-app-loading-card">
          <p>Loading client portal...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="client-app-page client-app-home-page">
      <section className="client-app-shell">
        <header className="client-app-topbar">
          <Link className="client-return-site-link" href="/">
            ← Return to website
          </Link>

          <Link className="client-settings-link" href="/client/settings" aria-label="Open settings">
            ⚙
          </Link>
        </header>

        <section className="client-app-hero-card">
          <div>
            <p className="client-app-kicker">Client Portal</p>
            <h1>Welcome back, {getGreetingName(profile)}</h1>
            <p>{profile?.email}</p>
          </div>

          <div className={`client-app-presence ${developerAtDesk ? "is-online" : "is-away"}`}>
            <span></span>
            {developerAtDesk ? "Developer online" : "Developer away"}
          </div>
        </section>

        <ClientTutorial />

        <section className="client-app-progress-card">
          <div className="client-app-card-head">
            <div>
              <p className="client-app-kicker">Progress</p>
              <h2>{activeProject?.title || "No active project yet"}</h2>
            </div>

            <strong>{activeProject ? `${activeProject.progress}%` : "0%"}</strong>
          </div>

          <div className="client-app-progress-ring-area">
            <div
              className="client-app-progress-ring"
              style={{ "--progress": `${activeProject?.progress || 0}%` } as React.CSSProperties}
            >
              <span>{activeProject?.progress || 0}%</span>
            </div>

            <div className="client-app-progress-copy">
              <span>{activeProject?.status || "Pending"}</span>
              <h3>{activeProject?.stage || "Project setup pending"}</h3>
              <p>{primaryUpdate?.next_steps || "Your next project update will appear here."}</p>
            </div>
          </div>
        </section>

        <section className="client-app-quick-grid">
          <Link className="client-app-mini-card" href="/client/messages">
            <span>💬</span>
            <strong>{unreadMessages.length}</strong>
            <p>Unread Messages</p>
          </Link>

          <Link className="client-app-mini-card" href="/client/billing">
            <span>💳</span>
            <strong>{monthlyTotal > 0 ? `$${monthlyTotal}` : "Pending"}</strong>
            <p>Current Billables</p>
          </Link>
        </section>

        <section className="client-app-update-card">
          <div className="client-app-card-head">
            <div>
              <p className="client-app-kicker">Latest Update</p>
              <h2>{primaryUpdate?.title || "No update posted yet"}</h2>
            </div>
            <time>{formatDate(primaryUpdate?.created_at)}</time>
          </div>

          <p>{primaryUpdate?.summary || "Once an update is posted, you will see the full summary here."}</p>

          <div className="client-app-update-stack">
            <div>
              <strong>Completed</strong>
              <p>{primaryUpdate?.completed_work || "Waiting for update"}</p>
            </div>

            <div>
              <strong>Next</strong>
              <p>{primaryUpdate?.next_steps || "Waiting for update"}</p>
            </div>

            <div className="is-highlighted">
              <strong>Action needed</strong>
              <p>{primaryUpdate?.client_action_needed || "No action needed right now"}</p>
            </div>
          </div>
        </section>

        <section className="client-app-action-grid">
          <Link href="/client/documents">📝 Documents</Link>
          <Link href="/client/billing">💳 Billing</Link>
          <Link href="/client/messages">💬 Messages</Link>
          <Link href="/client/files">📁 Files</Link>
        </section>

        <button className="client-app-signout" type="button" onClick={handleSignOut}>
          Sign Out
        </button>
      </section>

      <ClientMobileNav />
    </main>
  );
}
