"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  status: string;
  stage: string;
  progress: number;
};

type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  read_at: string | null;
  created_at: string;
};

type DeveloperPresence = {
  id: string;
  is_logged_in: boolean | null;
  last_seen_at: string | null;
};

const CHAT_BUCKET = "chat-attachments";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export default function ClientMessagesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [developerAtDesk, setDeveloperAtDesk] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function fetchMessages(projectId: string, currentUserId = profile?.id) {
    if (currentUserId) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("project_id", projectId)
        .is("read_at", null)
        .neq("sender_id", currentUserId);
    }

    const { data: messageData } = await supabase
      .from("messages")
      .select("id, project_id, sender_id, body, attachment_url, attachment_type, attachment_name, read_at, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    setMessages((messageData || []) as Message[]);
  }

  async function loadMessages() {
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

    const { data: projectData, error: projectError } = await supabase
      .from("client_projects")
      .select("id, title, status, stage, progress")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError || !projectData) {
      setProject(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    setProject(projectData as Project);
    await fetchMessages(projectData.id, userId);
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      event.target.value = "";
      setSelectedImage(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image is too large. Use an image under 5 MB.");
      event.target.value = "";
      setSelectedImage(null);
      return;
    }

    setSelectedImage(file);
  }

  async function uploadChatImage(projectId: string, senderId: string, file: File) {
    const safeName = cleanFileName(file.name);
    const filePath = `${projectId}/${senderId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      type: file.type,
      name: file.name
    };
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project || !profile) return;

    const trimmedBody = messageBody.trim();

    if (!trimmedBody && !selectedImage) {
      alert("Write a message or choose an image.");
      return;
    }

    setSending(true);

    try {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      let attachmentName: string | null = null;

      if (selectedImage) {
        const uploaded = await uploadChatImage(project.id, profile.id, selectedImage);
        attachmentUrl = uploaded.url;
        attachmentType = uploaded.type;
        attachmentName = uploaded.name;
      }

      const { error } = await supabase.from("messages").insert({
        project_id: project.id,
        sender_id: profile.id,
        body: trimmedBody || (attachmentName ? `Uploaded ${attachmentName}` : ""),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_name: attachmentName
      });

      if (error) {
        alert(error.message);
        return;
      }

      setMessageBody("");
      setSelectedImage(null);

      const fileInput = document.getElementById("client-chat-image") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await fetchMessages(project.id, profile.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      alert(message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading messages...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Client Messages</p>
            <h1>Messages</h1>
            <p>{profile?.email}</p>
          </div>

          <div className="portal-header-actions">
            <Link className="portal-link" href="/">
              Home
            </Link>

            <Link className="portal-link" href="/client">
              ← Client
            </Link>
          </div>
        </header>

        <article className="portal-card">
          {!project ? (
            <p>No project has been assigned yet. Messaging will activate after your project is created.</p>
          ) : (
            <>
              <h2>{project.title}</h2>
              <p>
                {project.stage} · {project.status} · {project.progress}%
              </p>

              <div className={`developer-status-inline ${developerAtDesk ? "is-online" : "is-away"}`}>
                <span className="developer-status-dot"></span>
                <p>
                  {developerAtDesk
                    ? "Developer is currently at his desk. Message me here in the client portal."
                    : "Developer is currently away from his desk. Please call or send email for a timely response."}
                </p>
              </div>

              <div className="message-thread">
                {messages.length === 0 ? (
                  <p>No messages yet.</p>
                ) : (
                  messages.map((message) => {
                    const isClient = message.sender_id === profile?.id;

                    return (
                      <div
                        className={`message-bubble ${
                          isClient ? "client-message" : "admin-message"
                        }`}
                        key={message.id}
                      >
                        <span>{isClient ? "You" : "Medios Accesible"}</span>

                        {message.body && <p>{message.body}</p>}

                        {message.attachment_url && message.attachment_type?.startsWith("image/") && (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="message-attachment-link"
                          >
                            <img
                              className="message-attachment"
                              src={message.attachment_url}
                              alt={message.attachment_name || "Chat attachment"}
                            />
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <form className="message-form imessage-form" onSubmit={sendMessage}>
                <div className="imessage-composer">
                  <label className="imessage-photo-button" aria-label="Attach image">
                    <input
                      id="client-chat-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />

                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h3l1.4-2h7.2L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </label>

                  <textarea
                    className="imessage-textarea"
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    placeholder="Message..."
                    rows={1}
                  />

                  <button
                    className="imessage-send-button"
                    type="submit"
                    disabled={sending}
                    aria-label="Send message"
                  >
                    {sending ? "…" : "↑"}
                  </button>
                </div>

                {selectedImage && (
                  <div className="imessage-file-chip">
                    <span>{selectedImage.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        const fileInput = document.getElementById("client-chat-image") as HTMLInputElement | null;
                        if (fileInput) fileInput.value = "";
                      }}
                      aria-label="Remove selected image"
                    >
                      ×
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
