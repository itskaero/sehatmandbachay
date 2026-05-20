export interface DiseaseSearchResult {
  _id: string;
  name: string;
  slug: string;
  alternativeNames: string[];
  abbreviations: string[];
  specialtyTags: string[];
  icdCodes: string[];
  lastUpdated: string;
}

export interface DiseaseSummary extends DiseaseSearchResult {
  etiology: string;
  epidemiology: string;
  clinicalManifestations: string;
  treatment: string;
  prognosis: string;
  viewCount: number;
  isTrending: boolean;
}

export interface NavSection {
  id: string;
  label: string;
  icon?: string;
}

export interface GuidelineRecommendation {
  source: string;
  year: number;
  recommendation: string;
  evidenceLevel: string;
}

export interface Investigation {
  name: string;
  finding: string;
  significance: string;
}

export interface DifferentialDiagnosis {
  name: string;
  distinguishingFeatures: string;
}

export interface Reference {
  authors: string;
  title: string;
  journal: string;
  year: number;
  url: string;
  source: string;
}
