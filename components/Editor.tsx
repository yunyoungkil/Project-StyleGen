import React, { useState, useEffect, useRef } from 'react';
import type { Template, TextElement } from '../types';
import MaskingToolbar from './MaskingToolbar';
import MaskingCanvas, { type MaskingCanvasRef } from './MaskingCanvas';


interface EditorProps {
  referenceImage: string;
  template: Template;
  textElements: TextElement[];
  onTextElementsChange: React.Dispatch<React.SetStateAction<TextElement[]>>;
  onCreativeRemix: (prompt: string, mask: string | null, creativity: number, renderingStyle: string) => void;
  isRemixing: boolean;
}

interface DraggableTextProps {
  element: TextElement;
  onUpdate: (id: string, updates: Partial<TextElement>) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableText: React.FC<DraggableTextProps> = ({ element, onUpdate, onSelect, isSelected, containerRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(element.id);
    setIsDragging(true);

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: element.x, y: element.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStartPos.current.x) / containerRect.width) * 100;
      const dy = ((e.clientY - dragStartPos.current.y) / containerRect.height) * 100;
      
      onUpdate(element.id, { x: elementStartPos.current.x + dx, y: elementStartPos.current.y + dy });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdate, element.id, containerRef]);

  const style: React.CSSProperties = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    fontSize: `${element.fontSize}vw`,
    color: element.color,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    textAlign: element.textAlign,
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div
      style={style}
      className={`absolute p-1 select-none ${isSelected ? 'outline-dashed outline-2 outline-blue-500' : ''}`}
      onMouseDown={handleMouseDown}
    >
      {element.content}
    </div>
  );
};


const Editor: React.FC<EditorProps> = ({ referenceImage, template, textElements, onTextElementsChange, onCreativeRemix, isRemixing }) => {
  const [activeElementId, setActiveElementId] = useState<string | null>(textElements[0]?.id || null);
  const [remixPrompt, setRemixPrompt] = useState('');
  const [creativity, setCreativity] = useState<number>(50);
  const [renderingStyle, setRenderingStyle] = useState('Photorealistic');
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [maskTool, setMaskTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState<number>(40);
  const maskingCanvasRef = useRef<MaskingCanvasRef>(null);

  const activeElement = textElements.find(el => el.id === activeElementId);

  const handleUpdate = (id: string, updates: Partial<TextElement>) => {
    onTextElementsChange(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    if (!activeElementId) return;
    const { name, value } = e.target;
    handleUpdate(activeElementId, { [name]: name === 'fontSize' || name === 'fontWeight' ? parseFloat(value) : value });
  };

  const handleRemixClick = () => {
    const maskDataUrl = maskingCanvasRef.current?.getMaskDataURL() ?? null;
    onCreativeRemix(remixPrompt, maskDataUrl, creativity, renderingStyle);
  };

  const getCreativityLabel = () => {
    if (creativity <= 20) return { title: "정밀 편집", description: "마스킹한 영역만 수정합니다. 원본 레이아웃은 유지됩니다." };
    if (creativity <= 70) return { title: "스타일 재해석", description: "원본 스타일을 유지하며 텍스트에 맞게 구도를 재해석합니다." };
    return { title: "창의적 생성", description: "원본을 영감으로만 사용해 텍스트 중심의 새 이미지를 만듭니다." };
  }

  const renderingStyles = {
    'Photorealistic': '실사/사진',
    'Illustration': '일러스트',
    'Cartoon/Comic': '카툰/만화',
    'Watercolor/Oil Painting': '수채화/유화',
    'Infographic Style': '인포그래픽',
    '3D Render': '3D 렌더링',
  };

  const SubjectBox: React.FC = () => {
    if (!template.subject) return null;
    const { x, y, width, height } = template.subject;
    const style: React.CSSProperties = {
      left: `${x}%`,
      top: `${y}%`,
      width: `${width}%`,
      height: `${height}%`,
      transform: 'translate(-50%, -50%)',
    };
    return (
      <div 
        style={style} 
        className="absolute border-2 border-dashed border-green-400 opacity-75 pointer-events-none"
        title="감지된 피사체 영역"
      >
        <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-1 rounded-sm">피사체</div>
      </div>
    );
  };

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-6" style={{height: 'calc(100vh - 120px)'}}>
      {/* Left Panel: Reference Image */}
      <div className="lg:col-span-3 bg-gray-800 rounded-lg p-4 flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">참조 이미지</h3>
        <img src={referenceImage} alt="Reference" className="w-full h-auto object-contain rounded-md" />
      </div>

      {/* Center Panel: Canvas */}
      <div className="lg:col-span-6 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-2 gap-4">
        <div 
          id="canvas-container" 
          ref={canvasContainerRef}
          className="relative w-full aspect-[4/3] bg-cover bg-center bg-gray-900 rounded-md overflow-hidden"
          style={{ backgroundImage: `url(${template.generatedImageUrl})` }}
        >
          {isRemixing && (
            <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                <svg className="w-10 h-10 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-white font-semibold">이미지 생성 중...</p>
                <p className="text-gray-400 text-sm">AI가 프롬프트와 창의성 설정에 따라 작업 중입니다.</p>
             </div>
           )}
          <SubjectBox />
          <MaskingCanvas ref={maskingCanvasRef} tool={maskTool} brushSize={brushSize} />
          {textElements.map(el => (
            <DraggableText
              key={el.id}
              element={el}
              onUpdate={handleUpdate}
              onSelect={setActiveElementId}
              isSelected={el.id === activeElementId}
              containerRef={canvasContainerRef}
            />
          ))}
        </div>
        <MaskingToolbar
            activeTool={maskTool}
            onToolChange={setMaskTool}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            onClear={() => maskingCanvasRef.current?.clearMask()}
            onInvert={() => maskingCanvasRef.current?.invertMask()}
        />
      </div>

      {/* Right Panel: Inspector */}
      <div className="lg:col-span-3 bg-gray-800 rounded-lg p-4 flex flex-col overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800">속성</h3>
        {activeElement ? (
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-300">텍스트 편집</h4>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-400 mb-1">내용</label>
              <textarea
                id="content"
                name="content"
                value={activeElement.content}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 border border-gray-600"
              />
            </div>
             <div>
              <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-400 mb-1">글꼴</label>
              <select
                id="fontFamily"
                name="fontFamily"
                value={activeElement.fontFamily}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 border border-gray-600"
              >
                {template.recommendedFonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
                 <option disabled>---</option>
                 <option value="Arial, sans-serif">Arial</option>
                 <option value="Verdana, sans-serif">Verdana</option>
                 <option value="Georgia, serif">Georgia</option>
                 <option value="'Times New Roman', serif">Times New Roman</option>
                 <option value="'Courier New', monospace">Courier New</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label htmlFor="fontSize" className="block text-sm font-medium text-gray-400 mb-1">글자 크기 (vw)</label>
                  <input
                    type="number"
                    id="fontSize"
                    name="fontSize"
                    value={activeElement.fontSize}
                    onChange={handleInputChange}
                    step="0.1"
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 border border-gray-600"
                  />
                </div>
                 <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-400 mb-1">색상</label>
                    <div className="relative">
                       <input
                         type="color"
                         id="color"
                         name="color"
                         value={activeElement.color}
                         onChange={handleInputChange}
                         className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                       />
                    </div>
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">색상 팔레트</label>
              <div className="flex flex-wrap gap-2">
                {template.colorPalette.map(color => (
                   <button
                     key={color}
                     className="w-8 h-8 rounded-full border-2 border-gray-600"
                     style={{ backgroundColor: color }}
                     onClick={() => handleUpdate(activeElement.id, { color })}
                   />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500">
            <p>편집할 텍스트를 선택하세요.</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
          <h4 className="text-md font-semibold text-gray-300">AI 생성 제어판</h4>
          <div>
              <label htmlFor="remixPrompt" className="block text-sm font-medium text-gray-400 mb-1">이미지 프롬프트</label>
               <input
                  type="text"
                  id="remixPrompt"
                  name="remixPrompt"
                  value={remixPrompt}
                  onChange={(e) => setRemixPrompt(e.target.value)}
                  placeholder="예: '사막에 착륙하는 우주선'"
                  className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 border border-gray-600"
              />
          </div>
          <div>
            <label htmlFor="renderingStyle" className="block text-sm font-medium text-gray-400 mb-1">렌더링 스타일</label>
            <select
              id="renderingStyle"
              name="renderingStyle"
              value={renderingStyle}
              onChange={(e) => setRenderingStyle(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 border border-gray-600"
            >
              {Object.entries(renderingStyles).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
           <div>
              <label htmlFor="creativity" className="block text-sm font-medium text-gray-400 mb-1">
                창의성: <span className="font-bold text-blue-400">{getCreativityLabel().title}</span>
              </label>
              <input
                  id="creativity"
                  type="range"
                  min="0"
                  max="100"
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">{getCreativityLabel().description}</p>
          </div>
          <button
            onClick={handleRemixClick}
            disabled={isRemixing || !remixPrompt}
            className="w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isRemixing ? '생성 중...' : '이미지 생성'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;