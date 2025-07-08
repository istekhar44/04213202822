import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';

// Logger
const log = (message) => {
  const logs = JSON.parse(localStorage.getItem('logs')) || [];
  const newLog = { timestamp: new Date().toISOString(), message: String(message) };
  logs.push(newLog);
  localStorage.setItem('logs', JSON.stringify(logs));
};

// Home Page – URL Shortener + Log Viewer
const Home = () => {
  const [inputs, setInputs] = useState([{ longUrl: '', validity: '', shortcode: '' }]);
  const [shortened, setShortened] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('logs')) || [];
    setLogs(storedLogs.reverse());
  }, []);

  const handleChange = (index, field, value) => {
    const newInputs = [...inputs];
    newInputs[index][field] = value;
    setInputs(newInputs);
  };

  const addField = () => {
    if (inputs.length < 5) {
      setInputs([...inputs, { longUrl: '', validity: '', shortcode: '' }]);
    }
  };

  const generateShortCode = () => Math.random().toString(36).substring(2, 7);

  const handleSubmit = () => {
    const results = [];
    const now = Date.now();

    for (let input of inputs) {
      const { longUrl, validity, shortcode } = input;

      try {
        if (!longUrl || !/^https?:\/\/.+\..+/.test(longUrl)) {
          throw new Error('Invalid URL format');
        }

        const minutes = validity ? parseInt(validity) : 30;
        if (isNaN(minutes) || minutes <= 0) {
          throw new Error('Validity must be a positive number');
        }

        const finalShortcode =
          shortcode && /^[a-zA-Z0-9]+$/.test(shortcode)
            ? shortcode
            : generateShortCode();

        const existing = JSON.parse(localStorage.getItem('shortUrls')) || [];
        if (existing.find((item) => item.shortcode === finalShortcode)) {
          throw new Error(`Shortcode "${finalShortcode}" already exists`);
        }

        const newEntry = {
          longUrl,
          shortcode: finalShortcode,
          createdAt: now,
          expiry: now + minutes * 60000,
        };

        existing.push(newEntry);
        localStorage.setItem('shortUrls', JSON.stringify(existing));
        log(`Shortened: ${longUrl} → ${finalShortcode}`);
        results.push(newEntry);
      } catch (err) {
        log(`Error: ${err.message}`);
        alert(err.message);
      }
    }

    setShortened(results);
  };

  const clearLogs = () => {
    localStorage.removeItem('logs');
    setLogs([]);
    log('Logs cleared');
  };

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      <nav>
        <Link to="/">Home</Link> | <Link to="/stats">Stats</Link>
      </nav>
      {inputs.map((input, index) => (
        <div className="form-row" key={index}>
          <input
            type="text"
            placeholder="Long URL"
            value={input.longUrl}
            onChange={(e) => handleChange(index, 'longUrl', e.target.value)}
          />
          <input
            type="number"
            placeholder="Validity (min)"
            value={input.validity}
            onChange={(e) => handleChange(index, 'validity', e.target.value)}
          />
          <input
            type="text"
            placeholder="Custom shortcode"
            value={input.shortcode}
            onChange={(e) => handleChange(index, 'shortcode', e.target.value)}
          />
        </div>
      ))}
      {inputs.length < 5 && (
        <button className="add-btn" onClick={addField}>+ Add Another</button>
      )}
      <button className="submit-btn" onClick={handleSubmit}>Shorten URLs</button>

      {shortened.length > 0 && (
        <div className="result">
          <h2>Shortened URLs</h2>
          {shortened.map((url, i) => (
            <div key={i}>
              <a href={`http://localhost:3000/${url.shortcode}`} target="_blank" rel="noreferrer">
                localhost:3000/{url.shortcode}
              </a>
              <span> (Expires at: {new Date(url.expiry).toLocaleTimeString()})</span>
            </div>
          ))}
        </div>
      )}

      <div className="logs">
        <h2>Logs</h2>
        {logs.length === 0 ? (
          <p>No logs available.</p>
        ) : (
          <>
            <ul>
              {logs.map((l, i) => (
                <li key={i}>
                  <span className="timestamp">{l.timestamp}</span> – {l.message}
                </li>
              ))}
            </ul>
            <button className="clear-btn" onClick={clearLogs}>Clear Logs</button>
          </>
        )}
      </div>
    </div>
  );
};

// Redirect Page – Handles /:shortcode
const RedirectPage = () => {
  const { shortcode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('shortUrls')) || [];
    const entry = all.find((item) => item.shortcode === shortcode);

    if (!entry) {
      alert("Shortcode not found");
      return navigate("/");
    }

    if (Date.now() > entry.expiry) {
      alert("Link expired");
      return navigate("/");
    }

    window.location.href = entry.longUrl;
  }, [shortcode, navigate]);

  return <div className="container">Redirecting...</div>;
};

// Stats Page – View all stored shortened URLs
const StatsPage = () => {
  const [all, setAll] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('shortUrls')) || [];
    setAll(stored.reverse());
  }, []);

  return (
    <div className="container">
      <h1>All Shortened URLs</h1>
      <nav>
        <Link to="/">Home</Link> | <Link to="/stats">Stats</Link>
      </nav>
      {all.length === 0 ? (
        <p>No URLs stored.</p>
      ) : (
        <ul>
          {all.map((item, i) => (
            <li key={i}>
              <strong>{item.shortcode}</strong>:&nbsp;
              <a href={item.longUrl} target="_blank" rel="noreferrer">{item.longUrl}</a>
              &nbsp;| Expires at: {new Date(item.expiry).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Main App
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/:shortcode" element={<RedirectPage />} />
      </Routes>
    </Router>
  );
};

export default App;
