import React, { useState, useCallback, DragEvent } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  error?: string | null;
}

const UploadIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mx-auto text-gray-500"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);


const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onImageUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageUpload(e.target.files[0]);
    }
  };

  const borderColor = isDragging ? 'border-blue-500' : 'border-gray-600';
  const bgColor = isDragging ? 'bg-gray-700' : 'bg-gray-800';

  return (
    <div className="w-full h-full flex flex-col justify-center text-center p-4">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-4 text-left" role="alert">
          <strong className="font-bold block">생성 실패</strong>
          <span className="block text-sm">{error}</span>
        </div>
      )}

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-full border-2 ${borderColor} border-dashed rounded-xl transition-all duration-300 ${bgColor}`}
      >
        <UploadIcon />
        <p className="mt-4 text-gray-300 text-sm">
          <span className="font-semibold text-blue-400">이곳에 드래그</span> 또는 클릭
        </p>
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">PNG, JPG, WEBP</p>
    </div>
  );
};

export default ImageUploader;