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

type ProjectUpdate = {
  id: string;
  project_id: string;
  author_id: string;
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
  is_visible_to_client: boolean;
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
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);

  const [messageBody, setMessageBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("Website Build");
  const [newProjectPlan, setNewProjectPlan] = useState("Grow");
  const [newProjectPrice, setNewProjectPrice] = useState("300");

  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [editProjectStatus, setEditProjectStatus] = useState("active");
  const [editProjectStage, setEditProjectStage] = useState("");
  const [editProjectProgress, setEditProjectProgress] = useState("0");
  const [editProjectPlan, setEditProjectPlan] = useState("");
  const [editProjectPrice, setEditProjectPrice] = useState("");

  const [updateTitle, setUpdateTitle] = useState("Project Update");
  const [updateSummary, setUpdateSummary] = useState("");
  const [updateType, setUpdateType] = useState("general");
  const [updateCompletedWork, setUpdateCompletedWork] = useState("");
  const [updateNextSteps, setUpdateNextSteps] = useState("");
  const [updateClientAction, setUpdateClientAction] = useState("");
  const [updateBlockers, setUpdateBlockers] = useState("");
  const [updateEstimatedCompletion, setUpdateEstimatedCompletion] = useState("");
  const [updateVisibleToClient, setUpdateVisibleToClient] = useState(true);

  const [loading, setLoading] = useState(true);
  const [savingProject, setSavingProject] = useState(false);
  const [savingProjectUpdate, setSavingProjectUpdate] = useState(false);
  const [savingTimelineUpdate, setSavingTimelineUpdate] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  function syncProjectEditor(project: Project | null) {
    if (!project) {
      setEditProjectTitle("");
      setEditProjectStatus("active");
      setEditProjectStage("");
      setEditProjectProgress("0");
      setEditProjectPlan("");
      setEditProjectPrice("");
      return;
    }

    setEditProjectTitle(project.title || "");
    setEditProjectStatus(project.status || "active");
    setEditProjectStage(project.stage || "");
    setEditProjectProgress(String(project.progress ?? 0));
    setEditProjectPlan(project.plan || "");
    setEditProjectPrice(
      project.monthly_price === null || project.monthly_price === undefined
        ? ""
        : String(project.monthly_price)
    );
  }

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

  async function fetchProjectUpdates(projectId: string) {
    const { data: updateData } = await supabase
      .from("project_updates")
      .select(
        "id, project_id, author_id, title, summary, update_type, current_stage, progress_snapshot, completed_work, next_steps, client_action_needed, blockers, estimated_completion, is_visible_to_client, created_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    setProjectUpdates((updateData || []) as ProjectUpdate[]);
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
    syncProjectEditor(firstProject);

    if (firstProject) {
      await fetchMessages(firstProject.id, userId);
      await fetchProjectUpdates(firstProject.id);
    } else {
      setMessages([]);
      setProjectUpdates([]);
    }

    setLoading(false);
  }


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
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function selectProject(project: Project) {
    setSelectedProject(project);
    syncProjectEditor(project);
    setSelectedImage(null);
    await fetchMessages(project.id);
    await fetchProjectUpdates(project.id);
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

  async function updateSelectedProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProject) return;

    const cleanProgress = Math.min(
      100,
      Math.max(0, Number(editProjectProgress || 0))
    );

    setSavingProjectUpdate(true);

    const updates = {
      title: editProjectTitle.trim(),
      status: editProjectStatus.trim(),
      stage: editProjectStage.trim(),
      progress: cleanProgress,
      plan: editProjectPlan.trim() || null,
      monthly_price: editProjectPrice.trim() ? Number(editProjectPrice) : null
    };

    const { data, error } = await supabase
      .from("client_projects")
      .update(updates)
      .eq("id", selectedProject.id)
      .select("id, title, status, stage, progress, plan, monthly_price, client_id")
      .single();

    setSavingProjectUpdate(false);

    if (error) {
      alert(error.message);
      return;
    }

    const updatedProject = data as Project;

    setSelectedProject(updatedProject);
    syncProjectEditor(updatedProject);
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  }

  async function createProjectUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProject || !adminProfile || !updateSummary.trim()) return;

    setSavingTimelineUpdate(true);

    const { error } = await supabase.from("project_updates").insert({
      project_id: selectedProject.id,
      author_id: adminProfile.id,
      title: updateTitle.trim() || "Project Update",
      summary: updateSummary.trim(),
      update_type: updateType,
      current_stage: selectedProject.stage,
      progress_snapshot: selectedProject.progress,
      completed_work: updateCompletedWork.trim() || null,
      next_steps: updateNextSteps.trim() || null,
      client_action_needed: updateClientAction.trim() || null,
      blockers: updateBlockers.trim() || null,
      estimated_completion: updateEstimatedCompletion.trim() || null,
      is_visible_to_client: updateVisibleToClient
    });

    setSavingTimelineUpdate(false);

    if (error) {
      alert(error.message);
      return;
    }

    setUpdateTitle("Project Update");
    setUpdateSummary("");
    setUpdateType("general");
    setUpdateCompletedWork("");
    setUpdateNextSteps("");
    setUpdateClientAction("");
    setUpdateBlockers("");
    setUpdateEstimatedCompletion("");
    setUpdateVisibleToClient(true);

    await fetchProjectUpdates(selectedProject.id);
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

            {selectedProject && (
              <form className="portal-form project-update-form" onSubmit={updateSelectedProject}>
                <h3>Edit Selected Project</h3>

                <label>
                  Project Title
                  <input
                    value={editProjectTitle}
                    onChange={(event) => setEditProjectTitle(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Stage
                  <input
                    value={editProjectStage}
                    onChange={(event) => setEditProjectStage(event.target.value)}
                    placeholder="Onboarding, Design, Development, Review..."
                    required
                  />
                </label>

                <label>
                  Status
                  <select
                    value={editProjectStatus}
                    onChange={(event) => setEditProjectStatus(event.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="on hold">On Hold</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>

                <label>
                  Progress
                  <div className="project-progress-editor">
                    <div className="meter-label">
                      <span>{editProjectStage || "Current Progress"}</span>
                      <strong>{editProjectProgress}%</strong>
                    </div>

                    <div className="bar project-progress-preview">
                      <span style={{ width: `${editProjectProgress}%` }}></span>
                    </div>

                    <input
                      className="project-progress-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={editProjectProgress}
                      onChange={(event) => setEditProjectProgress(event.target.value)}
                    />
                  </div>
                </label>

                <label>
                  Plan
                  <input
                    value={editProjectPlan}
                    onChange={(event) => setEditProjectPlan(event.target.value)}
                    placeholder="Start, Grow, Pro..."
                  />
                </label>

                <label>
                  Monthly Price
                  <input
                    type="number"
                    value={editProjectPrice}
                    onChange={(event) => setEditProjectPrice(event.target.value)}
                    placeholder="300"
                  />
                </label>

                <button className="auth-submit" type="submit" disabled={savingProjectUpdate}>
                  {savingProjectUpdate ? "Saving..." : "Save Project Updates"}
                </button>
              </form>
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

          <article className="portal-card project-updates-card">
            <h2>Transparent Project Updates</h2>

            {!selectedProject ? (
              <p>Select a project before posting updates.</p>
            ) : (
              <>
                <p>
                  Post detailed updates the client can read from their portal. Use this for full transparency:
                  what changed, what is done, what is next, blockers, and what you need from the client.
                </p>

                <form className="portal-form project-update-post-form" onSubmit={createProjectUpdate}>
                  <h3>Post Detailed Update</h3>

                  <label>
                    Update Title
                    <input
                      value={updateTitle}
                      onChange={(event) => setUpdateTitle(event.target.value)}
                      placeholder="Project Update"
                      required
                    />
                  </label>

                  <label>
                    Update Type
                    <select
                      value={updateType}
                      onChange={(event) => setUpdateType(event.target.value)}
                    >
                      <option value="general">General</option>
                      <option value="milestone">Milestone</option>
                      <option value="design">Design</option>
                      <option value="development">Development</option>
                      <option value="review">Review</option>
                      <option value="billing">Billing</option>
                      <option value="client-needed">Client Needed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </label>

                  <label>
                    Main Update / Summary
                    <textarea
                      value={updateSummary}
                      onChange={(event) => setUpdateSummary(event.target.value)}
                      placeholder="Explain clearly what changed, what was worked on, and the current situation..."
                      required
                    />
                  </label>

                  <label>
                    Completed Work
                    <textarea
                      value={updateCompletedWork}
                      onChange={(event) => setUpdateCompletedWork(event.target.value)}
                      placeholder="List what has been completed since the last update..."
                    />
                  </label>

                  <label>
                    Next Steps
                    <textarea
                      value={updateNextSteps}
                      onChange={(event) => setUpdateNextSteps(event.target.value)}
                      placeholder="Explain what you will work on next..."
                    />
                  </label>

                  <label>
                    Client Action Needed
                    <textarea
                      value={updateClientAction}
                      onChange={(event) => setUpdateClientAction(event.target.value)}
                      placeholder="Tell the client exactly what you need from them, if anything..."
                    />
                  </label>

                  <label>
                    Blockers / Delays
                    <textarea
                      value={updateBlockers}
                      onChange={(event) => setUpdateBlockers(event.target.value)}
                      placeholder="Mention anything slowing the project down. Leave blank if none."
                    />
                  </label>

                  <label>
                    Estimated Completion / Timing
                    <input
                      value={updateEstimatedCompletion}
                      onChange={(event) => setUpdateEstimatedCompletion(event.target.value)}
                      placeholder="Example: Friday afternoon, 2 business days, waiting on assets..."
                    />
                  </label>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={updateVisibleToClient}
                      onChange={(event) => setUpdateVisibleToClient(event.target.checked)}
                    />
                    Visible to client
                  </label>

                  <button className="auth-submit" type="submit" disabled={savingTimelineUpdate}>
                    {savingTimelineUpdate ? "Posting..." : "Post Transparent Update"}
                  </button>
                </form>

                <div className="project-updates-list">
                  {projectUpdates.length === 0 ? (
                    <p>No project updates posted yet.</p>
                  ) : (
                    projectUpdates.map((update) => (
                      <div className="project-update-item" key={update.id}>
                        <div className="project-update-meta">
                          <span>{update.update_type}</span>
                          <time>{new Date(update.created_at).toLocaleDateString()}</time>
                        </div>

                        <h3>
                          {update.title}
                          {!update.is_visible_to_client && (
                            <span className="private-update-label">Private</span>
                          )}
                        </h3>

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
                            <strong>Client needed:</strong>
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
                    ))
                  )}
                </div>
              </>
            )}
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
