export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-info">
            <p className="footer-text">
              © 2025 Crowd Data Visualizer v2.0. 
              <span className="tech-stack">React + Chart.js + ES6 Modules</span>
            </p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link" aria-label="技術情報">技術情報</a>
            <a href="#" className="footer-link" aria-label="データソース">データソース</a>
            <a href="#" className="footer-link" aria-label="フィードバック">フィードバック</a>
          </div>
        </div>
      </div>
    </footer>
  );
}