"use client";
import { useRef, useState } from "react";
import type { CertificateData } from "@/lib/validation";
const labels: [keyof CertificateData, string][] = [
  ["candidateName", "Name of candidate"],
  ["certificateNumber", "Certificate number"],
  ["certificateType", "Certificate type"],
  ["institution", "Institution"],
  ["examNumber", "Exam number"],
  ["examCenter", "Exam center"],
  ["dateOfBirth", "Date of birth"],
  ["examDate", "Date of exam"],
  ["issuedDate", "Certificate issued"],
];
export default function Verifier() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CertificateData | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateNumber: number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to verify.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="primary" onClick={() => dialog.current?.showModal()}>
        Verify my certificate <span aria-hidden="true">↗</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="verify-heading"
        onClose={() => {
          setResult(null);
          setError("");
          setNumber("");
        }}
      >
        <button
          className="close"
          aria-label="Close verification"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <h2 id="verify-heading">Verify your certificate</h2>
        <p>Enter the certificate number printed on your document.</p>
        <form onSubmit={submit}>
          <label htmlFor="certificate-number">Certificate number</label>
          <input
            id="certificate-number"
            autoFocus
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            minLength={6}
            maxLength={64}
            required
            placeholder="e.g. BSR-2026-001234"
          />
          <button className="primary" disabled={busy}>
            {busy ? "Checking…" : "Check certificate"}
          </button>
        </form>
        <div aria-live="polite">
          {error && <p className="error">{error}</p>}
          {result && (
            <section className="result">
              <div className={result.isVerified ? "status yes" : "status no"}>
                {result.isVerified ? "Verified" : "Not verified"}
              </div>
              <p>
                {result.isVerified
                  ? "This record is marked verified by the administrator."
                  : "A record exists, but the administrator has not marked it verified."}
              </p>
              <dl>
                {labels.map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{String(result[key])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}
