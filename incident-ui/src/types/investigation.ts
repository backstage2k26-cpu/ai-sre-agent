export interface Investigation {
  context: any;
  deployment: any;
  logs: any;
  kubernetes: any;
  metrics: any;
  knowledge: any;
  correlation: any;

  network: Network;
  dependency: DependencySummary;

  evidence: Evidence;
  recommendations: RecommendationSummary;
  executive: ExecutiveSummary;
  verdict: Verdict;
  impact: Impact;

  report: string;

  timeline: {
    time: string;
    event: string;
  }[];
}

export interface Network {
  gateway_count: number;
  route_count: number;
  service_endpoints: number;

  gateway_ok: boolean;
  route_ok: boolean;
  endpoint_ok: boolean;

  gateway_name: string | null;
  gateway_namespace: string |null;

  route_name: string | null;
  route_accepted: boolean;
  route_programmed: boolean;

  service_name: string;
  assessment: string;
}

export interface Evidence {
  deployment: number;
  logs: number;
  kubernetes: number;
  metrics: number;
  network: number;
  knowledge: number;
  overall: number;
}

export interface Recommendation {
  priority: number;
  action: string;
  reason: string;
}

export interface RecommendationSummary {
  recommendations: Recommendation[];
  estimated_time: string;
}

export interface Dependency {
  name: string;
  kind: string;
  namespace: string;
  exists: boolean;
  healthy: boolean;
  message: string;
}

export interface DependencySummary {
  dependencies: Dependency[];
  healthy: boolean;
  assessment: string;
}

export interface ExecutiveSummary {
  summary: string[];
  likely_cause: string;
  recommended_owner: string;
}

export interface Verdict {
  status: string;
  confidence: number;
  root_cause: string;
  owner: string;
  investigation_time: string;
}

export interface Impact {
  affected_service: string;
  user_impact: string;
  availability: string;
  blast_radius: string;
  affected_pods: string;
  dependent_services: string[];
  business_impact: string;
}

export interface RootCause {
  title: string;
  description: string;
}

export interface RootCause {
  title: string;
  description: string;
}

export interface AIInvestigationResult {
  diagnosis: string;
  root_cause: RootCause;
  confidence: number;
  business_impact: string;
  resolution_plan: string[];
  prevention: string[];
  reasoning: string[];
  estimated_recovery_time: string;
}