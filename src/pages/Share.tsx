import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { Mascot } from "../components/Mascot";

export function Share() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const url = window.location.origin + import.meta.env.BASE_URL;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 208, margin: 2 }).catch(console.error);
    }
  }, [url]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="screen">
      <Link to="/" className="text-secondary" style={{ fontSize: 13, textDecoration: "none" }}>
        ← Back
      </Link>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <Mascot mood="cheer" size={72} />
        <h1 style={{ fontSize: 22, marginTop: 10 }}>Invite someone to Myou</h1>
        <p className="text-secondary" style={{ marginTop: 6, maxWidth: 320, marginInline: "auto" }}>
          Anyone who scans this code can open Myou on their own phone and try it for themselves.
        </p>

        <div
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: 14,
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "var(--shadow)",
          }}
        >
          <canvas ref={canvasRef} style={{ display: "block", width: 208, height: 208 }} />
        </div>

        <div
          className="card"
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            textAlign: "left",
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 13,
            }}
          >
            {url}
          </span>
          <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={copyLink}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <p className="text-muted" style={{ fontSize: 11, marginTop: 16 }}>
          This code always points to wherever Myou is running right now — share it fresh each time.
        </p>
      </div>
    </div>
  );
}
