export interface TextElement {
  id: string;
  content: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  fontSize: number; // vw unit
  color: string;
  fontFamily: string;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface Subject {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}


export interface Template {
  id: string;
  generatedImageUrl: string;
  textElements: TextElement[];
  recommendedFonts: string[];
  colorPalette: string[];
  styleDescription: string;
  subject?: Subject;
}