import React from 'react';

interface HeaderProps {
  onNewTemplate: () => void;
  showDownload: boolean;
}

const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const Header: React.FC<HeaderProps> = ({ onNewTemplate, showDownload }) => {
  const handleDownload = () => {
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && (window as any).html2canvas) {
      (window as any).html2canvas(canvasContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#111827', // Match bg-gray-900
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `stylegen-export-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <h1 className="text-xl font-bold text-white">Project StyleGen</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onNewTemplate}
            className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            새 템플릿
          </button>
          {showDownload && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              다운로드
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;