import mongoose, { Schema, Document } from 'mongoose';

export interface IDisease extends Document {
  name: string;
  slug: string;
  alternativeNames: string[];
  abbreviations: string[];
  icdCodes: string[];
  specialtyTags: string[];
  etiology: string;
  epidemiology: string;
  riskFactors: string[];
  genetics: string;
  pathophysiology: string;
  clinicalManifestations: string;
  redFlagSigns: string[];
  diagnosticCriteria: string;
  investigations: { name: string; finding: string; significance: string }[];
  diagnosticAlgorithm: string;
  differentialDiagnosis: { name: string; distinguishingFeatures: string }[];
  severityClassification: string;
  imagingFindings: string;
  laboratoryFindings: string;
  treatment: string;
  emergencyManagement: string;
  icuManagement: string;
  stepwiseManagement: string;
  guidelineRecommendations: { source: string; year: number; recommendation: string; evidenceLevel: string }[];
  recentAdvances: string;
  prognosis: string;
  prevention: string;
  followUp: string;
  pediatricConsiderations: string;
  pregnancyConsiderations: string;
  clinicalPearls: string[];
  doNotMissWarnings: string[];
  references: { authors: string; title: string; journal: string; year: number; url: string; source: string }[];
  lastUpdated: Date;
  isPublished: boolean;
  viewCount: number;
  isTrending: boolean;
}

const DiseaseSchema = new Schema<IDisease>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true },
    alternativeNames: [String],
    abbreviations: [String],
    icdCodes: [String],
    specialtyTags: [String],
    etiology: String,
    epidemiology: String,
    riskFactors: [String],
    genetics: String,
    pathophysiology: String,
    clinicalManifestations: String,
    redFlagSigns: [String],
    diagnosticCriteria: String,
    investigations: [{ name: String, finding: String, significance: String }],
    diagnosticAlgorithm: String,
    differentialDiagnosis: [{ name: String, distinguishingFeatures: String }],
    severityClassification: String,
    imagingFindings: String,
    laboratoryFindings: String,
    treatment: String,
    emergencyManagement: String,
    icuManagement: String,
    stepwiseManagement: String,
    guidelineRecommendations: [
      { source: String, year: Number, recommendation: String, evidenceLevel: String },
    ],
    recentAdvances: String,
    prognosis: String,
    prevention: String,
    followUp: String,
    pediatricConsiderations: String,
    pregnancyConsiderations: String,
    clinicalPearls: [String],
    doNotMissWarnings: [String],
    references: [
      { authors: String, title: String, journal: String, year: Number, url: String, source: String },
    ],
    lastUpdated: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    isTrending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DiseaseSchema.index({
  name: 'text',
  alternativeNames: 'text',
  abbreviations: 'text',
  specialtyTags: 'text',
});

export default mongoose.models.Disease || mongoose.model<IDisease>('Disease', DiseaseSchema);
