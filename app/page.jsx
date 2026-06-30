'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarCheck, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react';
import { pujas } from '@/lib/pujas';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const visiblePujas = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return pujas;
    return pujas.filter((puja) => `${puja.name} ${puja.temple} ${puja.category}`.toLowerCase().includes(value));
  }, [query]);

  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand">BhaktiSetu</Link>
        <nav>
          <a href="#pujas">Pujas</a>
          <a href="#trust">Trust</a>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="heroOverlay" />
        <div className="heroContent">
          <p className="eyebrow">Verified temple pujas</p>
          <h1>BhaktiSetu</h1>
          <p className="heroCopy">Book sacred pujas with sankalp, digital confirmation, and role-safe operations support.</p>
          <div className="heroActions">
            <a className="primaryBtn" href="#pujas">Browse Pujas</a>
            <Link className="secondaryBtn" href="/admin">Team Login</Link>
          </div>
        </div>
      </section>

      <section id="trust" className="trustBand">
        <div className="trustItem"><ShieldCheck size={22} /><span>Owner-only full data</span></div>
        <div className="trustItem"><UserRoundCheck size={22} /><span>Priest view: name & gotra only</span></div>
        <div className="trustItem"><CalendarCheck size={22} /><span>Booking tracking ready</span></div>
        <div className="trustItem"><Sparkles size={22} /><span>Razorpay test mode until live account</span></div>
      </section>

      <section id="pujas" className="section">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Puja catalogue</p>
            <h2>Choose a sacred ritual</h2>
          </div>
          <input
            className="searchInput"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search puja or temple"
          />
        </div>

        <div className="pujaGrid">
          {visiblePujas.map((puja) => (
            <article key={puja.id} className="pujaCard">
              <img src={puja.image} alt={puja.name} />
              <div className="pujaBody">
                <div className="tagRow"><span>{puja.tag}</span><strong>Rs {puja.price.toLocaleString()}</strong></div>
                <h3>{puja.name}</h3>
                <p className="muted">{puja.temple}</p>
                <p>{puja.description}</p>
                <Link className="cardBtn" href={`/book?puja=${puja.id}`}>Book / Enquire</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
