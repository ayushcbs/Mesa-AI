export interface StudyProfile {
  id: string;
  name: string;
  studyFocus: string;
  deskDimensions: string;
  lighting: string;
  chairType: string;
  comfortNeeds: string;
  targetDailyFocusHours?: number;
  isDefault?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface StudyTask {
  id: string;
  text: string;
  status: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  profileId?: string;
  targetDate?: any;
  createdAt?: any;
  estimatedDuration?: number; // Estimated duration in minutes
  timeSpent?: number; // Actual time logged in minutes
}

export interface ClientProject {
  id: string;
  clientName: string;
  projectName: string;
  workspaceType: string; // e.g., 'Creative Studio', 'Executive Desk', 'Developer Lab', 'Architect Bay'
  dimensions?: string;
  notes?: string;
  scores: {
    ergonomics: number;
    spatialEfficiency: number;
    visualHarmony: number;
    focusCalibration: number;
    productivityIndex: number;
  };
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  annotations?: WorkspaceAnnotation[];
  createdAt: any;
  updatedAt: any;
}

export interface WorkspaceAnnotation {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  comment: string;
  category: 'ergonomics' | 'lighting' | 'acoustics' | 'biophilic';
}

export interface WorkspaceAnalysis {
  id: string;
  projectId: string;
  imageUrl: string;
  resultText: string;
  createdAt: any;
  scores: {
    ergonomics: number;
    spatialEfficiency: number;
    visualHarmony: number;
    focusCalibration: number;
    productivityIndex: number;
  };
  detectedIssues: Array<{
    title: string;
    risk: 'low' | 'medium' | 'high';
    desc: string;
    action: string;
    category: 'ergonomics' | 'lighting' | 'clutter' | 'acoustics' | 'plants';
  }>;
}
