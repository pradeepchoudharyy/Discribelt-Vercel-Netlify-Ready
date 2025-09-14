import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { FaXTwitter, FaLinkedin } from "react-icons/fa6";
import { SiThreads } from "react-icons/si";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="app">
      <Header onHome={() => setPage("home")} />

      {page === "home" && <Home onD2T={() => setPage("d2t")} onT2D={() => setPage("t2d")} />}
      {page === "d2t" && <DiagramToText onBack={() => setPage("home")} />}
      {page === "t2d" && <TextToDiagram onBack={() => setPage("home")} />}

      {/* ✅ Floating share buttons */}
      <SocialShare />

      {/* ✅ Footer */}
      <Footer />
    </div>
  );
}

/* ---------------- Social Share ---------------- */
function SocialShare() {
  return (
    <div className="social-share">
      <a
        href="https://x.com/intent/tweet?text=Check%20out%20DescribeIt!"
        target="_blank"
        rel="noopener noreferrer"
        className="social-btn x"
      >
        <FaXTwitter className="icon" />
        <span className="label">Share on X</span>
      </a>

      <a
        href="https://www.linkedin.com/sharing/share-offsite/?url=https://your-site-url.com"
        target="_blank"
        rel="noopener noreferrer"
        className="social-btn linkedin"
      >
        <FaLinkedin className="icon" />
        <span className="label">Share on LinkedIn</span>
      </a>

      <a
        href="https://www.threads.net/intent/post?text=Check%20out%20DescribeIt!"
        target="_blank"
        rel="noopener noreferrer"
        className="social-btn threads"
      >
        <SiThreads className="icon" />
        <span className="label">Share on Threads</span>
      </a>
    </div>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} DescribeIt</span>
    </footer>
  );
}


/* ---------------- UI Sections ---------------- */
function Header({ onHome }) {
  return (
    <header className="header">
      <span className="brand" onClick={onHome} role="link" tabIndex={0}>DescribeIt</span>
      <nav className="nav"><button className="link" onClick={onHome}>Home</button></nav>
    </header>
  );
}

function Home({ onD2T, onT2D }) {
  return (
    <main className="container">
      <section className="hero">
        <h1 className="hero__title">
          <span className="hero__brand">DescribeIt</span>
        </h1>
        <p className="hero__tagline">
          Transform diagrams into clear descriptions, and turn text into beautiful diagrams — instantly.
        </p>
      </section>

      <h2 className="section-title">Choose a mode</h2>
      <div className="cards">
        <OptionCard
          title="Diagram → Text"
          description="Upload a diagram and get an accessible text description with AI-powered analysis."
          actionLabel="Open"
          onClick={onD2T}
        />
        <OptionCard
          title="Text → Diagram"
          description="Type a description and generate a clean, structured diagram preview instantly."
          actionLabel="Open"
          onClick={onT2D}
        />
      </div>
    </main>
  );
}


function OptionCard({ title, description, actionLabel, onClick }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <p className="card-desc">{description}</p>
      <button className="primary" onClick={onClick}>{actionLabel}</button>
    </div>
  );
}

/* ---------------- Pages ---------------- */
function BackBar({ onBack }) {
  return <div className="backbar"><button className="link" onClick={onBack}>← Back to Home</button></div>;
}

function DiagramToText({ onBack }) {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => () => previewURL && URL.revokeObjectURL(previewURL), [previewURL]);

  const handleFile = (f) => {
    setFile(f);
    if (previewURL) URL.revokeObjectURL(previewURL);
    setPreviewURL(f ? URL.createObjectURL(f) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post("http://localhost:5000/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.narration);
    } catch (err) {
      console.error(err);
      setResult("❌ Failed to generate description. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <BackBar onBack={onBack} />
      <h1 className="section-title">Diagram → Text</h1>

      {/* 🔹 LEFT = DropZone + Button | RIGHT = Result */}
      <div className="result-container">
        <div className="result-image">
          <form className="panel" onSubmit={handleSubmit}>
            <FileDropZone file={file} previewURL={previewURL} onFileSelect={handleFile} />
            <button className="primary" type="submit" disabled={!file || loading}>
              {loading ? "Processing…" : "Generate Description"}
            </button>
          </form>
        </div>

        <div className="result-text">
          <ResultBox value={result} />
        </div>
      </div>
    </main>
  );
}

function TextToDiagram({ onBack }) {
  const [text, setText] = useState("");
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => { 
    if (previewRef.current) previewRef.current.setAttribute("tabIndex", "0"); 
  }, [svg]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setSvg("");
    try {
      const res = await axios.post("http://localhost:5000/process", { text });
      setSvg(res.data.svg);
    } catch (err) {
      console.error(err);
      setSvg("<p>❌ Failed to generate diagram. Check server logs.</p>");
    } finally {
      setLoading(false);
    }
  };

  // 🔽 Download as PNG
  const handleDownload = () => {
    if (!previewRef.current) return;
    const svgElement = previewRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngFile;
      a.download = "diagram.png";
      a.click();

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <main className="container">
      <BackBar onBack={onBack} />
      <h1 className="section-title">Text → Diagram</h1>
      <div className="panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <form onSubmit={handleGenerate}>
          <label className="label">Enter description
            <textarea
              className="textarea"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Flowchart: Start → Check lamp → If plugged → Bulb check"
            />
          </label>
          <button className="primary" type="submit" disabled={!text.trim() || loading}>
            {loading ? "Generating…" : "Generate Diagram"}
          </button>
        </form>

        <div className="preview" ref={previewRef} aria-live="polite">
          {svg ? (
            <div>
              <div className="preview-container">
                    <div dangerouslySetInnerHTML={{ __html: svg }} />
              </div>

              <button className="primary" style={{ marginTop: "10px" }} onClick={handleDownload}>
                ⬇ Download as PNG
              </button>
            </div>
          ) : (
            <EmptyHint />
          )}
        </div>
      </div>
    </main>
  );
}


/*-------- File Drop ----------*/

function FileDropZone({ file, previewURL, onFileSelect }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`dropzone ${dragOver ? "dragover" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="fileInput"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileInput}
      />

      {!previewURL ? (
        <label htmlFor="fileInput" className="dropzone-label">
          <div className="dropzone-icon">☁️</div>
          <p>Choose file or drop file</p>
        </label>
      ) : (
        <figure className="preview-box">
          <img src={previewURL} alt={file?.name} />
          <figcaption>{file?.name}</figcaption>
        </figure>
      )}
    </div>
  );
}



/* ---------------- Helpers ---------------- */
function ResultBox({ value }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [value]);

  if (!value) return null;

  const speakText = () => {
    if (!audioRef.current) {
      const utterance = new SpeechSynthesisUtterance(value);
      utterance.onend = () => setPlaying(false);
      speechSynthesis.speak(utterance);
      audioRef.current = utterance;
      setPlaying(true);
    } else if (playing) {
      speechSynthesis.cancel();
      setPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(value);
      utterance.onend = () => setPlaying(false);
      speechSynthesis.speak(utterance);
      audioRef.current = utterance;
      setPlaying(true);
    }
  };

  return (
    <section className="result">
      <h3 className="result-title">Result</h3>
      <pre className="code">{value}</pre>
      <button className="primary" onClick={speakText}>
        {playing ? "⏸ Pause" : "▶ Play"}
      </button>
    </section>
  );
}

function EmptyHint({ message = "No output yet. Run an action above to see results here." }) {
  return <div className="empty" role="status"><p className="muted">{message}</p></div>;
}


// function Footer() {
//   return <footer className="footer"><span>© {new Date().getFullYear()} DescribeIt</span></footer>;
// }

