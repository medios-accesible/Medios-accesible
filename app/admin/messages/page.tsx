"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminMobileNav from "../../../components/AdminMobileNav";
import { supabase } from "../../../lib/supabaseClient";

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
  client_id: string;
  stage: string;
  progress: number;
};

type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type ChatPreview = {
  client: Profile;
  project: Project | null;
  latestMessage: Message | null;
  unreadCount: number;
};

function formatTime(value?: string | null) {
  if (!value) return "No messages";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function AdminMessengerPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [clients, setClients] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadMessenger() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const currentAdminId = sessionData.session.user.id;
      setAdminId(currentAdminId);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentAdminId)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/client");
        return;
      }

      await supabase.from("developer_presence").upsert({
        id: "main",
        is_logged_in: true,
        last_seen_at: new Date().toISOString()
      });

      const { data: clientData } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, role")
        .eq("role", "client")
        .order("created_at", { ascending: false });

      const loadedClients = (clientData || []) as Profile[];
      setClients(loadedClients);

      const { data: projectData } = await supabase
        .from("client_projects")
        .select("id, title, client_id, stage, progress")
        .order("created_at", { ascending: false });

      const loadedProjects = (projectData || []) as Project[];
      setProjects(loadedProjects);

      const projectIds = loadedProjects.map((project) => project.id);

      if (projectIds.length > 0) {
        const { data: messageData } = await supabase
          .from("messages")
          .select("id, project_id, sender_id, body, read_at, created_at")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });

        setMessages((messageData || []) as Message[]);
      }

      setLoading(false);
    }

    loadMessenger();
  }, [router]);

  const chatPreviews = useMemo<ChatPreview[]>(() => {
    return clients
      .map((client) => {
        const clientProjects = projects.filter((project) => project.client_id === client.id);
        const clientProjectIds = clientProjects.map((project) => project.id);
        const clientMessages = messages.filter((message) =>
          clientProjectIds.includes(message.project_id)
        );

        const latestMessage = clientMessages[0] || null;
        const unreadCount = clientMessages.filter(
          (message) => !message.read_at && message.sender_id !== adminId
        ).length;

        return {
          client,
          project: clientProjects[0] || null,
          latestMessage,
          unreadCount
        };
      })
      .sort((a, b) => {
        const aTime = a.latestMessage?.created_at
          ? new Date(a.latestMessage.created_at).getTime()
          : 0;
        const bTime = b.latestMessage?.created_at
          ? new Date(b.latestMessage.created_at).getTime()
          : 0;
        return bTime - aTime;
      });
  }, [adminId, clients, messages, projects]);

  const filteredChats = chatPreviews.filter((chat) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [
      chat.client.full_name,
      chat.client.company_name,
      chat.client.email,
      chat.project?.title,
      chat.latestMessage?.body
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (loading) {
    return (
      <main className="admin-app-page">
        <section className="admin-app-loading-card">Loading messenger...</section>
        <AdminMobileNav />
      </main>
    );
  }

  return (
    <main className="admin-app-page admin-messenger-page">
      <header className="admin-app-topbar">
        <Link href="/admin">← Admin Home</Link>
        <span>Messenger</span>
      </header>

      <section className="admin-app-hero compact">
        <p className="admin-app-kicker">Admin Messenger</p>
        <h1>Chats</h1>
        <p>Open a client thread in the workspace to message directly.</p>
      </section>

      <section className="admin-chat-list-panel">
        <label className="admin-chat-search">
          <span className="sr-only">Search chats</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clients or messages"
          />
        </label>

        <div className="admin-imessage-list">
          {filteredChats.length === 0 ? (
            <article className="admin-empty-state">
              <h2>No chats found</h2>
              <p>Client conversations will appear here once projects and messages exist.</p>
            </article>
          ) : (
            filteredChats.map((chat) => (
              <Link
                className="admin-imessage-row"
                href={`/admin/clients/${chat.client.id}`}
                key={chat.client.id}
              >
                <div className="admin-chat-avatar">
                  {(chat.client.full_name || chat.client.company_name || chat.client.email || "C")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="admin-chat-copy">
                  <div>
                    <h2>{chat.client.full_name || chat.client.company_name || "Client"}</h2>
                    <time>{formatTime(chat.latestMessage?.created_at)}</time>
                  </div>

                  <p>
                    {chat.latestMessage?.body ||
                      chat.project?.title ||
                      chat.client.email ||
                      "No messages yet"}
                  </p>
                </div>

                {chat.unreadCount > 0 && <strong>{chat.unreadCount}</strong>}
              </Link>
            ))
          )}
        </div>
      </section>

      <AdminMobileNav />
    </main>
  );
}
