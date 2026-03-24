import React from 'react';
import AtlasConverter from './components/AtlasConverter';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Resonite GIF Exporter</h1>
        <p>Resoniteの連番カメラで撮った動画をGIFアニメに変換します</p>
      </header>
      <main>
        <AtlasConverter />
      </main>
    </div>
  );
}

export default App;
