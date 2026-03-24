import React, { useState, useRef, useEffect } from 'react';
import GIF from 'gif.js';
import { Image as ImageIcon, Settings, Download, Loader2, Play } from 'lucide-react';

const AtlasConverter = () => {
  const [url, setUrl] = useState('');
  const [fps, setFps] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const canvasRef = useRef(null);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
          e.preventDefault();
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleGenerate = async () => {
    if (!url) {
      setErrorMsg('画像をクリップボードから貼り付けてください (Ctrl+V)。');
      return;
    }
    
    setErrorMsg('');
    setIsGenerating(true);
    setResultUrl(null);
    
    const cols = 16;
    const rows = 16;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const frameWidth = Math.floor(img.width / cols);
          const frameHeight = Math.floor(img.height / rows);
          
          if (frameWidth <= 0 || frameHeight <= 0) {
            throw new Error('Invalid columns or rows for this image dimension.');
          }

          const canvas = canvasRef.current;
          canvas.width = frameWidth;
          canvas.height = frameHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const gif = new GIF({
            workers: 2,
            quality: 10,
            width: frameWidth,
            height: frameHeight,
            workerScript: '/gif.worker.js'
          });

          // Extract frames
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              ctx.clearRect(0, 0, frameWidth, frameHeight);
              ctx.drawImage(
                img,
                x * frameWidth, y * frameHeight, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight
              );
              // We need to pass the image data or tell gif.js to copy the canvas
              gif.addFrame(ctx, { delay: 1000 / fps, copy: true });
            }
          }

          gif.on('finished', (blob) => {
            const result = URL.createObjectURL(blob);
            setResultUrl(result);
            setIsGenerating(false);
          });

          gif.render();
        } catch (err) {
          console.error(err);
          setErrorMsg(err.message || 'Error occurred while processing frames.');
          setIsGenerating(false);
        }
      };

      img.onerror = () => {
        setErrorMsg('Failed to load image. Check if the URL is correct.');
        setIsGenerating(false);
      };

      img.src = url;
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to initialize processing.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="layout-grid">
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
          <Settings size={24} color="var(--primary)" /> Configuration
        </h2>
        
        <div style={{ padding: '2rem', border: '2px dashed var(--surface-border)', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem', background: url ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}>
          {url ? (
             <div><p style={{color: 'var(--text-main)', fontWeight: 600, margin: 0}}>✓ クリップボードから画像を読み込みました</p></div>
          ) : (
             <div>
               <ImageIcon size={32} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
               <p style={{color: 'var(--text-muted)', margin: 0}}>①Resoniteで画像を持ちながらコンテキストメニューを開いて<strong style={{color:'var(--text-main)'}}>画像をコピー</strong>してください。</p>
               <p style={{color: 'var(--text-muted)', margin: 0}}>②この画面で <strong style={{color:'var(--text-main)'}}>Ctrl+V</strong> を押してアトラス画像を貼り付けてください</p>
             </div>
          )}
        </div>

        <div className="form-group">
          <label>Framerate (FPS)</label>
          <input 
            type="number" 
            min="1" 
            max="60"
            value={fps}
            onChange={(e) => setFps(Math.max(1, parseInt(e.target.value) || 10))}
          />
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        <button 
          className="btn" 
          onClick={handleGenerate} 
          disabled={isGenerating || !url}
        >
          {isGenerating ? (
            <><Loader2 className="spinner" size={20} /> Processing...</>
          ) : (
            <><Play size={20} /> GIFアニメに変換</>
          )}
        </button>
      </div>

      <div className="preview-container glass-panel" style={{ marginTop: 0 }}>
        <h2>Preview</h2>
        {resultUrl ? (
          <div>
            <img src={resultUrl} alt="Generated GIF" className="gif-result" />
            <div style={{ marginTop: '1.5rem' }}>
              <a 
                href={resultUrl} 
                download="atlas-animation.gif" 
                style={{ textDecoration: 'none' }}
              >
                <button className="btn" style={{ background: 'var(--surface-border)', width: 'auto', display: 'inline-flex' }}>
                  <Download size={20} /> Download GIF
                </button>
              </a>
            </div>
          </div>
        ) : (
          <div style={{ padding: '3rem', color: 'var(--text-muted)', border: '2px dashed var(--surface-border)', borderRadius: '16px' }}>
            {isGenerating ? 'Generating animation...' : 'GIF will appear here'}
          </div>
        )}
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default AtlasConverter;
