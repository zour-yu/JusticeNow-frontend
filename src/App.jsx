import axios from 'axios';
import { Link, Route, Routes } from 'react-router-dom';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">JusticeNow frontend</p>
        <h1>Ready for your MERN backend.</h1>
        <p className="lede">
          This starter includes React, React Router, Axios, and a Vite build setup so you can
          connect pages to your API immediately.
        </p>
        <div className="actions">
          <Link className="button primary" to="/dashboard">
            Open dashboard
          </Link>
          <a className="button secondary" href="http://localhost:5000/api/health" target="_blank" rel="noreferrer">
            Check API
          </a>
        </div>
      </section>
      <section className="panel">
        <h2>Configured for</h2>
        <ul>
          <li>Client routing with React Router</li>
          <li>Backend requests through a shared Axios client</li>
          <li>Vite dev server and production build</li>
        </ul>
      </section>
    </main>
  );
}

function Dashboard() {
  return (
    <main className="shell compact">
      <section className="panel">
        <p className="eyebrow">Dashboard</p>
        <h1>Frontend connected.</h1>
        <p className="lede">Use the shared API client in this file to fetch from your Express routes.</p>
        <pre>{`api.get('/health')`}</pre>
        <Link className="button secondary" to="/">
          Back home
        </Link>
      </section>
    </main>
  );
}

export default function App() {
  void api;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}