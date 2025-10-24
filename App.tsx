import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import LoadingIndicator from './components/LoadingIndicator';
import Editor from './components/Editor';
import Header from './components/Header';
import { generateTemplateFromImage, creativeRemixImage } from './services/aiService';
import type { Template, TextElement } from './types';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRemixing, setIsRemixing] = useState<boolean>(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [editedTextElements, setEditedTextElements] = useState<TextElement[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setUploadedImage(base64String);
      setIsAnalyzing(true);
      
      try {
        const generatedTemplate = await generateTemplateFromImage(base64String);
        setTemplate(generatedTemplate);
        setEditedTextElements(generatedTemplate.textElements);
      } catch (error) {
        console.error("Failed to generate template:", error);
        setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다. 다른 이미지를 시도해 주세요.");
        setUploadedImage(null);
        setTemplate(null);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);
  
  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setTemplate(null);
    setEditedTextElements([]);
    setIsAnalyzing(false);
    setIsRemixing(false);
    setError(null);
  }, []);

  const handleCreativeRemix = useCallback(async (userPrompt: string, maskImage: string | null, creativity: number, renderingStyle: string) => {
    if (!template || !uploadedImage) return;
    setIsRemixing(true);
    setError(null);
    try {
      const newImageUrl = await creativeRemixImage(userPrompt, template.styleDescription, uploadedImage, maskImage, creativity, renderingStyle);
      setTemplate(prev => prev ? { ...prev, generatedImageUrl: newImageUrl } : null);
    } catch (err) {
      console.error("Failed to remix image:", err);
      setError(err instanceof Error ? err.message : "이미지 리믹스에 실패했습니다. AI가 사용 중이거나 지원되지 않는 콘텐츠일 수 있습니다.");
    } finally {
      setIsRemixing(false);
    }
  }, [template, uploadedImage]);

  const renderContent = () => {
    if (isAnalyzing) {
      return <LoadingIndicator />;
    }
    if (template && uploadedImage) {
      return (
        <Editor
          referenceImage={uploadedImage}
          template={template}
          textElements={editedTextElements}
          onTextElementsChange={setEditedTextElements}
          onCreativeRemix={handleCreativeRemix}
          isRemixing={isRemixing}
        />
      );
    }
    return <ImageUploader onImageUpload={handleImageUpload} error={error} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header onNewTemplate={handleReset} showDownload={!!template} />
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;