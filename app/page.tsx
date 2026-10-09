import Image from "next/image";
import Link from "next/link";
import Verifier from "@/components/Verifier";
export default function Home() {
  return (
    <>
      <header className="nav">
        <Link href="/" className="brand">
          <span className="logo">B</span>BSRverifier
        </Link>
        <nav>
          <a href="#about">About</a>
          <Link href="/login">Admin login</Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">BENUE STATE • EDUCATION RECORDS</span>
            <h1>
              Your certificate.
              <br />
              <em>Verified with confidence.</em>
            </h1>
            <p>
              Check certificate records for First School Leaving Certificate,
              Basic Education Certificate, and Benue State universities,
              polytechnics and colleges of education.
            </p>
            <Verifier />
            <div className="small">
              No account required. Just your certificate number.
            </div>
          </div>
          <figure>
            <Image
              src="/food-basket.png"
              alt="A basket of agricultural produce celebrating Benue as the Food Basket of the Nation"
              width={1536}
              height={1024}
              priority
            />
            <figcaption>Food Basket of the Nation</figcaption>
          </figure>
        </section>
        <section id="about" className="about">
          <span className="eyebrow">ONE SIMPLE LOOKUP</span>
          <h2>Education records, easier to check.</h2>
          <div className="cards">
            {[
              [
                "01",
                "Find your number",
                "Locate the certificate number printed on your certificate.",
              ],
              [
                "02",
                "Enter your number",
                "Select Verify my certificate and enter the number exactly as shown.",
              ],
              [
                "03",
                "Review your record",
                "See candidate details and the verification status saved by an administrator.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <p className="notice">
            Prototype for review. Only records entered by authorized
            administrators are available. A missing record does not establish
            that a certificate is invalid.
          </p>
        </section>
      </main>
      <footer>
        <strong>BSRverifier</strong>
        <span>Benue State, Nigeria · Certificate verification prototype</span>
      </footer>
    </>
  );
}
