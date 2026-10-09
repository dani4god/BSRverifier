"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { certificateTypes, type CertificateData } from "@/lib/validation";
type RecordData = CertificateData & { _id: string };
const empty: CertificateData = {
  certificateNumber: "",
  candidateName: "",
  examNumber: "",
  examCenter: "",
  dateOfBirth: "",
  isVerified: false,
  examDate: "",
  issuedDate: "",
  certificateType: "First School Leaving Certificate",
  institution: "",
};
const fields: [keyof CertificateData, string, string][] = [
  ["certificateNumber", "Certificate number", "text"],
  ["candidateName", "Name of candidate", "text"],
  ["institution", "Institution / school", "text"],
  ["examNumber", "Exam number", "text"],
  ["examCenter", "Exam center", "text"],
  ["dateOfBirth", "Date of birth", "date"],
  ["examDate", "Date of exam", "date"],
  ["issuedDate", "Date certificate was issued", "date"],
];
export default function Dashboard({ name }: { name: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CertificateData>({ ...empty });
  const [id, setId] = useState("");
  const [records, setRecords] = useState<RecordData[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/certificates?page=${page}&q=${encodeURIComponent(search)}`,
        { cache: "no-store" },
      );
      if (res.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecords(data.records);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load.");
    } finally {
      setLoading(false);
    }
  }, [page, search, router]);
  // Synchronize records with the remote API; state updates occur after its asynchronous response.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void load();
  }, [load]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        id ? `/api/admin/certificates/${id}` : "/api/admin/certificates",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(id ? "Certificate updated." : "Certificate added.");
      setId("");
      setForm({ ...empty });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  function edit(record: RecordData) {
    const next = { ...empty };
    for (const key of Object.keys(empty) as (keyof CertificateData)[])
      Object.assign(next, { [key]: record[key] });
    setForm(next);
    setId(record._id);
    setError("");
    setMessage("");
    document.getElementById("editor")?.scrollIntoView({ behavior: "smooth" });
  }
  async function logout() {
    setError("");
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error("Sign out failed. Please try again.");
      router.replace("/login");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed.");
    }
  }
  return (
    <>
      <header className="nav">
        <Link className="brand" href="/">
          BSRverifier
        </Link>
        <button className="secondary" onClick={logout}>
          Sign out
        </button>
      </header>
      <main className="dashboard">
        <span className="eyebrow">RECORD MANAGEMENT</span>
        <h1>Certificate dashboard</h1>
        <p>Welcome, {name}. Create and maintain candidate records.</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        <section id="editor" className="panel">
          <h2>{id ? "Edit certificate" : "Add certificate"}</h2>
          <form onSubmit={save}>
            <div className="form-grid">
              {fields.map(([key, label, type]) => (
                <div key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type={type}
                    required
                    maxLength={key === "certificateNumber" ? 64 : 160}
                    value={String(form[key])}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div>
                <label htmlFor="certificateType">Certificate type</label>
                <select
                  id="certificateType"
                  value={form.certificateType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      certificateType: e.target
                        .value as CertificateData["certificateType"],
                    })
                  }
                >
                  {certificateTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="isVerified">Is result verified?</label>
                <select
                  id="isVerified"
                  value={String(form.isVerified)}
                  onChange={(e) =>
                    setForm({ ...form, isVerified: e.target.value === "true" })
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
            <div className="actions">
              <button className="primary" disabled={busy}>
                {busy ? "Saving…" : id ? "Save changes" : "Add certificate"}
              </button>
              {id && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setId("");
                    setForm({ ...empty });
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>
        <section className="panel">
          <h2>
            Saved records <span className="small">({total})</span>
          </h2>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(q.trim());
            }}
          >
            <label htmlFor="search">Find by certificate number</label>
            <input
              id="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Exact certificate number"
              maxLength={64}
            />
            <button className="secondary">Search</button>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                setQ("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear
            </button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Certificate number</th>
                  <th>Candidate</th>
                  <th>Institution</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  records.map((r) => (
                    <tr key={r._id}>
                      <td>{r.certificateNumber}</td>
                      <td>{r.candidateName}</td>
                      <td>{r.institution}</td>
                      <td>
                        <span
                          className={r.isVerified ? "status yes" : "status no"}
                        >
                          {r.isVerified ? "Verified" : "Not verified"}
                        </span>
                      </td>
                      <td>
                        <button className="secondary" onClick={() => edit(r)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {loading ? (
            <p role="status">Loading records…</p>
          ) : (
            !records.length && <p>No records found.</p>
          )}
          <div className="actions">
            <button
              className="secondary"
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              className="secondary"
              disabled={page * 20 >= total || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
