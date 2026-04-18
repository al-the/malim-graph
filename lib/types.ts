export type UserRole = 'admin' | 'supervisor' | 'porter'
export type UserStatus = 'active' | 'suspended' | 'pending'

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  porter_id: string | null
  status: UserStatus
  created_at: string
  last_login: string | null
}

export type SubmissionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'flagged'
export type DataStatus = 'preliminary' | 'revised' | 'final' | 'not_applicable'
export type DataType =
  | 'official_published'
  | 'official_estimate'
  | 'third_party_estimate'
  | 'journalist_calculation'
export type ConflictReason =
  | 'different_measurement_method'
  | 'different_coverage'
  | 'different_definition'
  | 'one_preliminary'
  | 'possible_error'
  | 'unknown'
export type ConflictSeverity = 'minor' | 'moderate' | 'major'

export interface KeyStat {
  label: string
  value: string
  unit: string
  period: string
  geography: string
}

export interface S6Checklist {
  read_executive_summary: boolean
  url_is_direct: boolean
  stats_have_units: boolean
  is_original_work: boolean
  confidence_is_honest: boolean
}

export interface Submission {
  id: string
  porter_id: string
  porter_name: string
  submitted_at: string
  updated_at: string
  status: SubmissionStatus
  review_status: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null

  // Section 1
  s1_title_en: string
  s1_title_ms: string
  s1_source_authority: string
  s1_doc_type: string
  s1_url: string
  s1_source_url?: string
  s1_published_date: string
  s1_ref_period_start: string | null
  s1_ref_period_end: string | null
  s1_language: string[]

  // Section 2
  s2_summary: string
  s2_topics: string[]
  s2_geography: string[]
  s2_key_stats: KeyStat[]
  s2_main_subjects: string
  s2_data_status: DataStatus

  // Section 3
  s3_has_methodology: 'yes' | 'no' | 'partially'
  s3_methodology_note: string
  s3_coverage_gaps: string
  s3_data_type: DataType

  // Section 4
  s4_has_connections: 'yes' | 'no' | 'not_sure'
  s4_cited_docs: string[]
  s4_updates_previous: 'yes' | 'no'
  s4_updates_which: string
  s4_responds_to: string
  s4_corroborates: string
  s4_has_conflict: 'yes' | 'no' | 'not_sure'
  s4_conflict_source: string
  s4_conflict_value: string
  s4_conflict_reason: ConflictReason | ''
  s4_conflict_severity: ConflictSeverity | ''

  // Section 5
  s5_difficulty: number
  s5_confidence: number
  s5_unusual_findings: string
  s5_questions_for_admin: string

  // Section 6
  s6_checklist: S6Checklist

  // Conflict resolution
  conflict_resolved?: boolean
  conflict_resolution_strategy?: string
  conflict_resolution_note?: string
  conflict_resolved_by?: string
  conflict_resolved_at?: string
}

export type IndicatorFrequency = 'monthly' | 'quarterly' | 'annual' | 'periodic' | 'ad_hoc'
export type IndicatorStatus = 'active' | 'deprecated'

export interface Indicator {
  id: string
  indicator_id: string
  canonical_name: string
  canonical_name_ms: string
  authority: string
  series_code: string
  category: string
  unit: string
  base_year: string
  frequency: IndicatorFrequency
  methodology_reference: string
  sdg_alignment: string[]
  notes: string
  status: IndicatorStatus
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  log_id: string
  action: string
  performed_by: string
  performed_by_name: string
  target_id: string
  target_type: string
  diff: Record<string, unknown> | null
  timestamp: string
  action_date_month: string
}

export interface DashboardStats {
  role: UserRole
  // Porter
  total_submitted?: number
  approved?: number
  pending?: number
  rejected?: number
  // Supervisor/Admin additions
  total_submissions?: number
  pending_review?: number
  approved_today?: number
  active_porters?: number
  // Admin
  unresolved_conflicts?: number
}

export const SOURCE_AUTHORITIES = [
  'DOSM',
  'Bank Negara Malaysia',
  'Bursa Malaysia',
  'Parliament of Malaysia',
  'LKIM',
  'EPU',
  'MCMC',
  'Ministry of Health',
  'Ministry of Education',
  'Securities Commission',
  'Other',
] as const

export const DOC_TYPES = [
  'Statistical Report',
  'Annual Report',
  'Parliamentary Record',
  'News Article',
  'Policy or Regulation',
  'Press Release',
  'Research Paper',
  'Other',
] as const

export const TOPICS = [
  'Income & Poverty',
  'Employment',
  'Education',
  'Health',
  'Housing',
  'Finance',
  'Trade',
  'Demographics',
  'Environment',
  'Politics',
  'Corporate',
  'Fisheries',
  'Digital Economy',
  'Governance',
  'Other',
] as const

export const GEOGRAPHIES = [
  'National',
  'Peninsular Malaysia',
  'Sabah',
  'Sarawak',
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Selangor',
  'Terengganu',
  'W.P. Kuala Lumpur',
  'Specific District',
] as const

export const INDICATOR_CATEGORIES = [
  'Economic',
  'Social',
  'Environmental',
  'Governance',
  'Digital',
  'Financial',
  'Demographics',
  'Trade',
  'Education',
  'Health',
  'Other',
] as const
