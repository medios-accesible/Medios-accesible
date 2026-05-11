"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [checkingLink, setCheckingLink] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function prepareRecoverySession() {
      setError("");
      setMessage("");

      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error_description") || params.get("error");
      if (urlError) {
        setError(decodeURIComponent(urlError));
        setCheckingLink(false);
        return;
      }

      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message);
          setCheckingLink(false);
          return;
        }

        window.history.replaceState({}, document.title, "/update-password");
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setError("This reset link is expired or invalid. Please request a new password reset email.");
      }

      setCheckingLink(false);
    }

    prepareRecoverySession();
  }, []);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setLoading(false);
      setError("This reset session is missing or expired. Please request a new password reset email.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();

    setLoading(false);
    setMessage("Password updated. Redirecting to login...");

    setTimeout(() => {
      router.replace("/login?reset=success");
    }, 900);
  }

  if (checkingLink) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand">
            <img
              src="https://res.cloudinary.com/dovrzmlqj/image/upload/v1778281428/my-company-logo_gavksa.png"
              alt="Medios Accesible logo"
            />
            <span>Medios Accesible</span>
          </div>

          <h1>Opening Reset Link</h1>
          <p>Checking your password reset link...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <img
            src="https://res.cloudinary.com/dovrzmlqj/image/upload/v1778281428/my-company-logo_gavksa.png"
            alt="Medios Accesible logo"
          />
          <span>Medios Accesible</span>
        </div>

        <h1>Choose New Password</h1>
        <p>Enter your new password below.</p>

        <form onSubmit={handleUpdate} className="auth-form">
          <label>
            New Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading || Boolean(error)}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <a className="auth-link" href="/reset-password">
          Request a new reset email
        </a>

        <a className="auth-back" href="/login">
          ← Back to login
        </a>
      </section>
    </main>
  );
}
