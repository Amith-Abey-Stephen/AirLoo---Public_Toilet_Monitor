"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

export default function JoinPage() {
  const [status, setStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("Could not submit right now. Please try again.");
      return;
    }

    form.reset();
    setStatus("Request submitted. The AirLoo team will review it.");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel wide">
        <span className="eyebrow">Join AirLoo</span>
        <h1>Bring your shop into the public sanitation network.</h1>
        <p>There is no self signup. Submit your details and the admin team will onboard approved shops.</p>
        <form className="stack-form two-column" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Phone
            <input name="phone" required />
          </label>
          <label>
            Shop name
            <input name="shopName" required />
          </label>
          <label className="full-span">
            Location
            <input name="location" required />
          </label>
          <label className="full-span">
            Message
            <textarea name="message" rows={4} />
          </label>
          <button className="primary-button full-span" type="submit">
            <Send size={18} />
            Submit request
          </button>
        </form>
        {status ? <p className="toast">{status}</p> : null}
      </section>
    </main>
  );
}
