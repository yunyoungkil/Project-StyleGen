import React from 'react';

const BrushIcon = ({ active }: { active: boolean }) => (
    <svg className={`w-6 h-6 ${active ? 'text-blue-400' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);

const EraserIcon = ({ active }: { active: boolean }) => (
    <svg className={`w-6 h-6 ${active ? 'text-blue-400' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.42,12.44l7.14-7.14a2.12,2.12,0,0,0-3-3L9.42,9.44" />
        <path d="M17.66,17.66l-3-3" />
        <path d="M14.63,5.37L9.44,10.56a1,1,0,0,0,0,1.41l8,8a1,1,0,0,0,1.41,0l5.19-5.18" />
        <path d="M1,22l5.18-5.18" />
    </svg>
);

const InvertIcon = () => (
    <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 18a6 6 0 0 0 0-12v12z" />
    </svg>
);

const ClearIcon = () => (
    <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
    </svg>
);

interface MaskingToolbarProps {
    activeTool: 'brush' | 'eraser';
    onToolChange: (tool: 'brush' | 'eraser') => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    onClear: () => void;
    onInvert: () => void;
}

const MaskingToolbar: React.FC<MaskingToolbarProps> = ({
    activeTool,
    onToolChange,
    brushSize,
    onBrushSizeChange,
    onClear,
    onInvert
}) => {
    return (
        <div className="w-full max-w-md bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-lg p-2 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onToolChange('brush')} 
                    className={`p-2 rounded-md ${activeTool === 'brush' ? 'bg-blue-600/50' : 'hover:bg-gray-600'}`} 
                    title="브러시"
                >
                    <BrushIcon active={activeTool === 'brush'} />
                </button>
                <button 
                    onClick={() => onToolChange('eraser')} 
                    className={`p-2 rounded-md ${activeTool === 'eraser' ? 'bg-blue-600/50' : 'hover:bg-gray-600'}`} 
                    title="지우개"
                >
                    <EraserIcon active={activeTool === 'eraser'} />
                </button>
            </div>
            <div className="flex items-center gap-2 flex-grow">
                <span className="text-gray-400 text-sm">크기</span>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
             <div className="flex items-center gap-2 border-l border-gray-600 pl-4">
                <button onClick={onInvert} className="p-2 rounded-md hover:bg-gray-600" title="마스크 반전">
                    <InvertIcon />
                </button>
                <button onClick={onClear} className="p-2 rounded-md hover:bg-gray-600" title="전체 지우기">
                    <ClearIcon />
                </button>
            </div>
        </div>
    );
};

export default MaskingToolbar;