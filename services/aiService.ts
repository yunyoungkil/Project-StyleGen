import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Template, TextElement, Subject } from '../types';

function base64ToGenerativePart(base64: string) {
    const parts = base64.split(';base64,');
    if (parts.length !== 2) {
        throw new Error("Gemini에 사용할 수 없는 잘못된 base64 문자열 형식입니다.");
    }
    const mimeType = parts[0].split(':')[1];
    const data = parts[1];
    return {
        inlineData: {
            mimeType,
            data
        }
    };
}

export const generateTemplateFromImage = async (image: string): Promise<Template> => {
  console.log("AI Service: Analyzing image with Gemini...");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Step 1: Analyze the image to get style, text, colors, and subject.
  const analysisPrompt = `Analyze the provided image. Describe its style, identify all text elements with their properties, extract the main color palette, suitable fonts, and identify the bounding box of the main subject. If no text is found, return an empty array for text_elements. If no single main subject is clear, omit the subject field.`;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      style_description: {
        type: Type.STRING,
        description: "A detailed description of the background style, mood, textures, and overall aesthetic. For example: 'A dark, moody, cinematic background with a subtle gradient and a soft texture.'"
      },
      text_elements: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The detected text content." },
            x: { type: Type.NUMBER, description: "The horizontal position of the text's center as a percentage from the left (0-100)." },
            y: { type: Type.NUMBER, description: "The vertical position of the text's center as a percentage from the top (0-100)." },
            width: { type: Type.NUMBER, description: "The estimated width of the text block as a percentage of the image width (0-100)." },
            font_suggestion: { type: Type.STRING, description: "A suggestion for a font family, e.g., 'Impact, sans-serif'." },
            font_weight: { type: Type.NUMBER, description: "A suggestion for font weight, e.g., 800." },
            font_size_vw: { type: Type.NUMBER, description: "A suggested font size relative to viewport width (vw), e.g., 6." },
            color_hex: { type: Type.STRING, description: "The hex code of the text color, e.g., '#FFFFFF'." }
          },
        }
      },
      subject: {
        type: Type.OBJECT,
        description: "Bounding box for the main subject.",
        properties: {
            x: { type: Type.NUMBER, description: "The horizontal position of the box's center as a percentage from the left (0-100)." },
            y: { type: Type.NUMBER, description: "The vertical position of the box's center as a percentage from the top (0-100)." },
            width: { type: Type.NUMBER, description: "The width of the box as a percentage of the image width (0-100)." },
            height: { type: Type.NUMBER, description: "The height of the box as a percentage of the image height (0-100)." }
        }
      },
      color_palette: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 5 prominent hex color codes from the image."
      },
      recommended_fonts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 3-4 font family names that match the image style."
      }
    }
  };

  const analysisResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [
            base64ToGenerativePart(image),
            { text: analysisPrompt }
        ]
    },
    config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
    }
  });

  let analysisResult;
  try {
    const analysisResultText = analysisResponse.text.trim();
    analysisResult = JSON.parse(analysisResultText);
  } catch (e) {
    console.error("Failed to parse analysis JSON:", e, "Raw response:", analysisResponse.text);
    throw new Error("AI 분석이 잘못된 데이터를 반환했습니다. 이미지가 너무 복잡하거나 지원되지 않는 요소를 포함할 수 있습니다.");
  }
  
  console.log("Analysis result:", analysisResult);

  // Step 2: Format the response into the Template structure.
  const textElements: TextElement[] = (analysisResult.text_elements || []).map((el: any, index: number) => ({
      id: `text-${index + 1}`,
      content: el.content || "텍스트 편집",
      x: el.x || 10,
      y: el.y || 10 + (index * 20),
      width: el.width || 80,
      fontSize: el.font_size_vw || 4,
      color: el.color_hex || '#FFFFFF',
      fontFamily: el.font_suggestion || 'sans-serif',
      fontWeight: el.font_weight || 400,
      textAlign: 'center',
  }));

  if (textElements.length === 0) {
      textElements.push({
          id: 'text-1',
          content: '제목을 입력하세요',
          x: 50, y: 50, width: 80,
          fontSize: 5,
          color: analysisResult.color_palette?.[0] || '#FFFFFF',
          fontFamily: analysisResult.recommended_fonts?.[0] || 'sans-serif',
          fontWeight: 700,
          textAlign: 'center',
      });
  }

  const finalTemplate: Template = {
    id: `template-${Date.now()}`,
    generatedImageUrl: image, // Use the original image for the canvas
    textElements: textElements,
    recommendedFonts: analysisResult.recommended_fonts || ['Arial', 'Helvetica', 'sans-serif'],
    colorPalette: analysisResult.color_palette || ['#FFFFFF', '#000000', '#3B82F6', '#10B981', '#F59E0B'],
    styleDescription: analysisResult.style_description || 'a modern, clean style',
    subject: analysisResult.subject as Subject | undefined,
  };

  return finalTemplate;
};


export const creativeRemixImage = async (
  userPrompt: string,
  styleDescription: string,
  originalImage: string,
  maskImage: string | null,
  creativity: number, // 0-100
  renderingStyle: string
): Promise<string> => {
  console.log(`AI Service: Starting Creative Remix with creativity ${creativity} and style ${renderingStyle}...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imagePart = base64ToGenerativePart(originalImage);
  const parts: any[] = [imagePart];
  let imageGenPrompt: string;
  
  const styleClause = `in a ${renderingStyle} style`;

  // Mode 1: Precision Edit (Inpainting)
  if (creativity <= 20 && maskImage) {
    console.log("AI Service: Mode 1 - Precision Edit (Inpainting).");
    const maskPart = base64ToGenerativePart(maskImage);
    parts.push(maskPart);
    imageGenPrompt = `Using the provided image and mask, generate content for the masked area that depicts: '${userPrompt}' ${styleClause}. The new content must blend seamlessly with the rest of the image, following its style which is described as: "${styleDescription}". Do not include any text in the generated image.`;
  } else { // Mode 2 & 3: Image-to-Image
    if (creativity <= 70) {
      // Mode 2: Style Recreation
      console.log("AI Service: Mode 2 - Style Recreation.");
      imageGenPrompt = `Use the provided image as a style reference. Generate a new image that depicts: '${userPrompt}' ${styleClause}. The new image must strictly follow the style of the reference image, which is described as: "${styleDescription}". Do not include any text in the generated image.`;
    } else {
      // Mode 3: Creative Generation
      console.log("AI Service: Mode 3 - Creative Generation.");
      imageGenPrompt = `Use the provided image as a high-level style reference for mood and color. Generate a completely new and creative image that depicts: '${userPrompt}' ${styleClause}. Prioritize the prompt over the original image's layout and subject. Do not include any text in the generated image.`;
    }
  }

  parts.push({ text: imageGenPrompt });


  const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
          parts: parts
      },
      config: { responseModalities: [Modality.IMAGE] },
  });

  let generatedImageBase64 = '';
  if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
              generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
          }
      }
  }

  if (!generatedImageBase64) {
      console.error("Creative Remix failed. Response:", imageResponse);
      throw new Error("AI가 리믹스 이미지를 생성하는 데 실패했습니다.");
  }

  console.log("AI Service: Creative Remix successful.");
  return generatedImageBase64;
};