"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

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
  client_id: string;
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

const CHAT_BUCKET = "chat-attachments";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export default function AdminClientWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = String(params.id);

  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [messageBody, setMessageBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("Website Build");
  const [newProjectPlan, setNewProjectPlan] = useState("Grow");
  const [newProjectPrice, setNewProjectPrice] = useState("300");

  const [loading, setLoading] = useState(true);
  const [savingProject, setSavingProject] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  async function fetchMessages(projectId: string, currentAdminId = adminProfile?.id) {
    if (currentAdminId) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("project_id", projectId)
        .is("read_at", null)
        .neq("sender_id", currentAdminId);
    }

    const { data: messageData } = await supabase
      .from("messages")
      .select("id, project_id, sender_id, body, attachment_url, attachment_type, attachment_name, read_at, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    setMessages((messageData || []) as Message[]);
  }

  async function loadWorkspace() {
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

    const { data: clientData } = await supabase
      .from("profiles")
      .select("id, email, full_name, company_name, role")
      .eq("id", clientId)
      .single();

    setClient((clientData || null) as Profile | null);

    const { data: projectData } = await supabase
      .from("client_projects")
      .select("id, title, status, stage, progress, plan, monthly_price, client_id")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    const loadedProjects = (projectData || []) as Project[];
    setProjects(loadedProjects);

    const firstProject = loadedProjects[0] || null;
    setSelectedProject(firstProject);

    if (firstProject) {
      await fetchMessages(firstProject.id, userId);
    } else {
      setMessages([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function selectProject(project: Project) {
    setSelectedProject(project);
    setSelectedImage(null);
    await fetchMessages(project.id);
  }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingProject(true);

    const { error } = await supabase.from("client_projects").insert({
      client_id: clientId,
      title: newProjectTitle,
      status: "active",
      stage: "Onboarding",
      progress: 10,
      plan: newProjectPlan,
      monthly_price: Number(newProjectPrice)
    });

    setSavingProject(false);

    if (error) {
      alert(error.message);
      return;
    }

    await loadWorkspace();
  }

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

    if (!selectedProject || !adminProfile) return;

    const trimmedBody = messageBody.trim();

    if (!trimmedBody && !selectedImage) {
      alert("Write a message or choose an image.");
      return;
    }

    setSendingMessage(true);

    try {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      let attachmentName: string | null = null;

      if (selectedImage) {
        const uploaded = await uploadChatImage(selectedProject.id, adminProfile.id, selectedImage);
        attachmentUrl = uploaded.url;
        attachmentType = uploaded.type;
        attachmentName = uploaded.name;
      }

      const { error } = await supabase.from("messages").insert({
        project_id: selectedProject.id,
        sender_id: adminProfile.id,
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

      const fileInput = document.getElementById("admin-chat-image") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await fetchMessages(selectedProject.id, adminProfile.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      alert(message);
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading client workspace...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Client Workspace</p>
            <h1>{client?.full_name || client?.company_name || "Client"}</h1>
            <p>{client?.email}</p>
          </div>

          <div className="portal-header-actions">
            <Link className="portal-link" href="/">
              Home
            </Link>

            <Link className="portal-link" href="/admin">
              ← Admin
            </Link>
          </div>
        </header>

        <div className="portal-grid portal-grid-two">
          <article className="portal-card">
            <h2>Projects</h2>

            {projects.length === 0 ? (
              <p>No project exists for this client yet.</p>
            ) : (
              <div className="portal-list">
                {projects.map((project) => (
                  <button
                    type="button"
                    className="portal-list-item portal-clickable"
                    key={project.id}
                    onClick={() => selectProject(project)}
                  >
                    <div>
                      <h3>{project.title}</h3>
                      <p>
                        {project.stage} · {project.status}
                      </p>
                    </div>

                    <strong>{project.progress}%</strong>
                  </button>
                ))}
              </div>
            )}

            <form className="portal-form" onSubmit={createProject}>
              <h3>Create Project</h3>

              <label>
                Project Title
                <input
                  value={newProjectTitle}
                  onChange={(event) => setNewProjectTitle(event.target.value)}
                  required
                />
              </label>

              <label>
                Plan
                <input
                  value={newProjectPlan}
                  onChange={(event) => setNewProjectPlan(event.target.value)}
                />
              </label>

              <label>
                Monthly Price
                <input
                  type="number"
                  value={newProjectPrice}
                  onChange={(event) => setNewProjectPrice(event.target.value)}
                />
              </label>

              <button className="auth-submit" type="submit" disabled={savingProject}>
                {savingProject ? "Creating..." : "Create Project"}
              </button>
            </form>
          </article>

          <article className="portal-card">
            <h2>Private Messages</h2>

            {!selectedProject ? (
              <p>Create or select a project before messaging.</p>
            ) : (
              <>
                <p>
                  Messaging for <strong>{selectedProject.title}</strong>
                </p>

                <div className="message-thread">
                  {messages.length === 0 ? (
                    <p>No messages yet.</p>
                  ) : (
                    messages.map((message) => {
                      const isAdmin = message.sender_id === adminProfile?.id;

                      return (
                        <div
                          className={`message-bubble ${
                            isAdmin ? "admin-message" : "client-message"
                          }`}
                          key={message.id}
                        >
                          <span>{isAdmin ? "You" : client?.full_name || "Client"}</span>

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
                        id="admin-chat-image"
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
                      disabled={sendingMessage}
                      aria-label="Send message"
                    >
                      {sendingMessage ? "…" : "↑"}
                    </button>
                  </div>

                  {selectedImage && (
                    <div className="imessage-file-chip">
                      <span>{selectedImage.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          const fileInput = document.getElementById("admin-chat-image") as HTMLInputElement | null;
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
        </div>
      </section>
    </main>
  );
}
