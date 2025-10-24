export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  topic: string;
  region: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  source_name: string; // e.g., "Reuters Wire", "Twitter Trending"
  credibility_score: number; // 0-100
  timestamp: string; // ISO 8601 format
}

export interface GraphNode {
  id: string;
  group: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GroundingChunk {
  web?: {
    // FIX: Made uri and title optional to match the @google/genai library type.
    uri?: string;
    title?: string;
  };
}

export interface VerificationResult {
  analysis: string;
  sources: GroundingChunk[];
}

// New Types for Workflow Orchestration
export type WorkflowStatus = 'pending' | 'running' | 'success' | 'failed';

export interface WorkflowModuleState {
  name: string;
  status: WorkflowStatus;
}

export type WorkflowState = Record<string, WorkflowModuleState>;

// New Types for Data Feeds and Entity Analysis
export interface DataFeed {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface NuancedSentimentAnalysis {
    overall: string;
    positive_points: string[];
    negative_points: string[];
    confidence_score: 'High' | 'Medium' | 'Low';
    reasoning: string;
}

export interface EntityDossier {
    summary:string;
    connections: string[];
    sentiment_analysis: NuancedSentimentAnalysis;
}

/**
 * Defines the API contract for the simulated OSINT Data Extraction Service.
 * This represents the expected output from a backend OSINT crawling and processing job.
 */
export interface OSINTServiceResponse {
  extracted_articles: Omit<NewsArticle, 'id'>[];
  job_id: string;
  status: 'completed' | 'failed';
}

// New Type for consolidated API call to fix rate limiting
export interface IntelligencePackage {
  articles: NewsArticle[];
  graph: GraphData;
}
