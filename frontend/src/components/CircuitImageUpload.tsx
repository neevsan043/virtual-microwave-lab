import { useState, useRef, useCallback, useEffect } from 'react';
import { ComponentType } from '../types';
import { aiService, AIAnalysisResult } from '../services/aiService';
import './CircuitImageUpload.css';

interface CircuitImageUploadProps {
  onLoadComponents: (params: { components: any[], connections: any[] }) => void;
  onClose: () => void;
}

type Stage = 'idle' | 'preview' | 'analysing' | 'results' | 'error';
type LoadResult = AIAnalysisResult & { autoConnections?: number };

export default function CircuitImageUpload({ onLoadComponents, onClose }: CircuitImageUploadProps) {
  const [stage, setStage]             = useState<Stage>('idle');
  const [isDragging, setIsDragging]   = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [result, setResult]           = useState<LoadResult | null>(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [statusText, setStatusText]   = useState('');
  const [countdown, setCountdown]     = useState(0);  // seconds until auto-retry
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = useCallback((file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Please upload a JPG, PNG, or WEBP image.');
      setStage('error');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStage('preview');
    setErrorMsg('');
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // ── Auto-retry countdown ───────────────────────────────────────────────────
  const startCountdown = useCallback((seconds: number, onDone: () => void) => {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  // ── Analysis ───────────────────────────────────────────────────────────────
  const handleAnalyse = useCallback(async (file?: File) => {
    const f = file ?? selectedFile;
    if (!f) return;
    setStage('analysing');
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }

    const messages = [
      '🔍 Reading circuit diagram…',
      '🧠 Identifying components…',
      '📡 Matching to component library…',
      '✅ Almost done…',
    ];
    let idx = 0;
    setStatusText(messages[0]);
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, messages.length - 1);
      setStatusText(messages[idx]);
    }, 2500);

    try {
      const analysis = await aiService.analyzeCircuitImage(f);
      clearInterval(interval);
      setResult(analysis);
      setStage('results');
    } catch (err: any) {
      clearInterval(interval);
      const status     = err?.response?.status;
      const backendMsg = err?.response?.data?.error || err?.response?.data?.details || '';
      const retryAfter: number = err?.response?.data?.retryAfter ?? 60;

      if (status === 429) {
        setErrorMsg('quota');
        setStage('error');
        startCountdown(retryAfter, () => handleAnalyse(f));
      } else {
        setErrorMsg(backendMsg || err.message || 'Analysis failed. Please try again.');
        setStage('error');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, startCountdown]);


  // ── Load to workspace ──────────────────────────────────────────────────────
  const handleLoad = () => {
    if (!result) return;
    onLoadComponents({ components: result.matchedComponents, connections: result.connections || [] });
    onClose();
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStage('idle');
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
    setCountdown(0);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="ciu-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ciu-modal">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="ciu-header">
          <div className="ciu-header-left">
            <div className="ciu-icon">🤖</div>
            <div>
              <h2 className="ciu-title">AI Circuit Analyser</h2>
              <p className="ciu-subtitle">Upload a circuit diagram — AI identifies components &amp; auto-wires the signal chain</p>
            </div>
          </div>
          <button className="ciu-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Content area ────────────────────────────────────────────────── */}
        <div className="ciu-body">

          {/* IDLE — drop zone */}
          {stage === 'idle' && (
            <div
              className={`ciu-dropzone ${isDragging ? 'ciu-dropzone--drag' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="ciu-drop-icon">📸</div>
              <p className="ciu-drop-heading">Drag &amp; drop your circuit image here</p>
              <p className="ciu-drop-sub">or click to browse — JPG, PNG, WEBP supported</p>
              <div className="ciu-drop-badge">Up to 10 MB</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={onFileInput}
              />
            </div>
          )}

          {/* PREVIEW — show image + analyse button */}
          {stage === 'preview' && selectedFile && (
            <div className="ciu-preview">
              <div className="ciu-preview-img-wrap">
                <img src={previewUrl!} alt="Circuit preview" className="ciu-preview-img" />
                <div className="ciu-preview-badge">
                  <span>📄 {selectedFile.name}</span>
                  <span>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                </div>
              </div>
              <div className="ciu-preview-actions">
                <button className="ciu-btn ciu-btn--ghost" onClick={handleReset}>
                  🔄 Change Image
                </button>
                <button className="ciu-btn ciu-btn--primary" onClick={() => handleAnalyse()}>
                  🔍 Analyse Circuit
                </button>
              </div>
            </div>
          )}

          {stage === 'analysing' && (
            <div className="ciu-analysing">
              <div className="ciu-spinner-ring">
                <svg viewBox="0 0 50 50" className="ciu-spinner-svg">
                  <circle className="ciu-spinner-track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                  <circle className="ciu-spinner-arc" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                </svg>
              </div>
              <p className="ciu-status">{statusText}</p>
              <div className="ciu-progress-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* RESULTS */}
          {stage === 'results' && result && (
            <div className="ciu-results">
              {/* thumbnail */}
              {previewUrl && (
                <img src={previewUrl} alt="Analysed circuit" className="ciu-result-thumb" />
              )}

              <div className="ciu-result-stats">
                <div className="ciu-stat ciu-stat--green">
                  <span className="ciu-stat-num">{result.matchedComponents.length}</span>
                  <span className="ciu-stat-label">Matched</span>
                </div>
                <div className="ciu-stat ciu-stat--orange">
                  <span className="ciu-stat-num">{result.unmatchedComponents.length}</span>
                  <span className="ciu-stat-label">Unknown</span>
                </div>
                <div className="ciu-stat ciu-stat--blue">
                  <span className="ciu-stat-num">{result.detectedComponents.length}</span>
                  <span className="ciu-stat-label">Detected</span>
                </div>
                <div className="ciu-stat ciu-stat--purple">
                  <span className="ciu-stat-num">{result.connections?.length || 0}</span>
                  <span className="ciu-stat-label">Auto-wired</span>
                </div>
              </div>

              {result.matchedNames.length > 0 && (
                <div className="ciu-section">
                  <h4 className="ciu-section-title">✅ Components to Load</h4>
                  <div className="ciu-chips">
                    {result.matchedNames.map((name, i) => (
                      <span key={i} className="ciu-chip ciu-chip--green">{name}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.unmatchedComponents.length > 0 && (
                <div className="ciu-section">
                  <h4 className="ciu-section-title">⚠️ Not in Library</h4>
                  <div className="ciu-chips">
                    {result.unmatchedComponents.map((name, i) => (
                      <span key={i} className="ciu-chip ciu-chip--orange">{name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="ciu-result-actions">
                <button className="ciu-btn ciu-btn--ghost" onClick={handleReset}>
                  🔄 Try Another Image
                </button>
                {result.matchedTypes.length > 0 ? (
                  <>
                    <div className="ciu-autowire-note">
                      ⚡ Components will be placed in signal-flow order and auto-wired left → right
                    </div>
                    <button className="ciu-btn ciu-btn--primary" onClick={handleLoad}>
                      ⚡ Load {result.matchedTypes.length} Component{result.matchedTypes.length !== 1 ? 's' : ''} + Auto-Wire
                    </button>
                  </>
                ) : (
                  <p className="ciu-no-match">No matching components found. Try a clearer image.</p>
                )}
              </div>
            </div>
          )}

          {/* ERROR / QUOTA */}
          {stage === 'error' && (
            <div className="ciu-error">
              {errorMsg === 'quota' ? (
                <>
                  <div className="ciu-quota-icon">⏳</div>
                  <p className="ciu-quota-title">
                    {import.meta.env.DEV ? 'Gemini API quota exceeded' : 'AI service is busy'}
                  </p>
                  <p className="ciu-quota-sub">
                    {import.meta.env.DEV
                      ? <>The free-tier rate limit has been hit. The analysis will <strong>auto-retry</strong> in:</>
                      : <>The analysis service is temporarily at capacity. It will <strong>auto-retry</strong> in:</>
                    }
                  </p>
                  <div className="ciu-countdown">{countdown}s</div>
                  <div className="ciu-countdown-bar-track">
                    <div
                      className="ciu-countdown-bar"
                      style={{ width: `${(countdown / 60) * 100}%` }}
                    />
                  </div>
                  {import.meta.env.DEV && (
                    <p className="ciu-quota-hint">
                      <strong>Dev only:</strong> Get a new free key at{' '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                        aistudio.google.com/apikey
                      </a>{' '}
                      and update <code>backend/.env → GEMINI_API_KEY</code>
                    </p>
                  )}
                  <div className="ciu-error-btns">
                    <button className="ciu-btn ciu-btn--ghost" onClick={handleReset}>
                      ❌ Cancel
                    </button>
                    <button className="ciu-btn ciu-btn--primary" onClick={() => handleAnalyse()}>
                      ↻ Retry Now
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="ciu-error-icon">⚠️</div>
                  <p className="ciu-error-msg">{errorMsg}</p>
                  {import.meta.env.DEV && errorMsg.includes('GEMINI_API_KEY') && (
                    <p className="ciu-error-hint">
                      Set <code>GEMINI_API_KEY</code> in <code>backend/.env</code>.<br />
                      Get a free key at{' '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                        aistudio.google.com/apikey
                      </a>
                    </p>
                  )}
                  <button className="ciu-btn ciu-btn--ghost" onClick={handleReset}>
                    🔄 Try Again
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer tip ──────────────────────────────────────────────────── */}
        <div className="ciu-footer">
          <span>💡 Works best with clear schematic diagrams or lab layout photos</span>
        </div>
      </div>
    </div>
  );
}
