import React from 'react';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex justify-center items-center">
        <div className="absolute w-24 h-24 rounded-full animate-ping bg-blue-500 opacity-50"></div>
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-bold text-white">AI가 이미지를 분석하고 있습니다...</h2>
      <p className="mt-2 text-gray-400">레이아웃, 스타일, 텍스트를 추출하여 템플릿을 만드는 중입니다.</p>
    </div>
  );
};

export default LoadingIndicator;