"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit your message.");
      form.reset();
      setState("success");
      setMessage("Your message has been received. Thank you.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit your message.");
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      {state === "error" && <div className="notice notice-error">{message}</div>}
      {state === "success" && <div className="notice notice-success">{message}</div>}
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Your Name</label><input required id="name" name="name" className="input" maxLength={120} /></div>
        <div className="field"><label htmlFor="email">Email Address</label><input required type="email" id="email" name="email" className="input" maxLength={160} /></div>
        <div className="field full"><label htmlFor="subject">Subject</label><input required id="subject" name="subject" className="input" maxLength={180} /></div>
        <div className="field full"><label htmlFor="message">Message</label><textarea required id="message" name="message" className="textarea" maxLength={5000} /></div>
        <input name="website" tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden="true" />
      </div>
      <div className="form-actions"><button className="btn btn-primary" disabled={state === "loading"}>{state === "loading" ? "Sending..." : "Submit Message"}</button></div>
    </form>
  );
}
