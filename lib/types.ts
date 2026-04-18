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
  'Department of Statistics Malaysia',
  'Bursa Malaysia',
  'Parliament of Malaysia',
  'Attorney Generals Chambers of Malaysia',
  'Securities Commission',
  'Bank Negara Malaysia',
  'Other',
] as const

export const DOC_TYPES = [
  'Statistical Report',
  'Study Report',
  'Annual Report',
  'Hansard',
  'News Article',
  'Policy or Regulation',
  'Press Release',
  'Research Paper',
  'Other',
] as const

export const TOPICS = [
/* --- DOSM / STATISTICAL --- */
  'Current Population Estimates', 'Births & Deaths', 'Causes of Death', 
  'Life Expectancy', 'Marriage & Divorce', 'Migration', 'Population Projection',
  'Population Census', 'Economic Census', 'Agricultural Census', 'Oil & Gas Census',
  'Gross Domestic Product', 'Balance of Payments', 
  'International Investment Position', 'Satellite Accounts & Others',
  'Consumer Price Index', 'Producer Price Index', 
  'Services Producer Price Index', 'Building Materials Cost Index',
  'Labour Force Survey', 'Informal Sector Workforce', 'Salaries & Wages', 
  'Labour Productivity', 'Employment', 'Graduates', 'Job Market Insights',
  'Services', 'Manufacturing', 'Agriculture', 'Mining', 'Construction', 
  'External Trade', 'Tourism', 'Creative Industry', 'Businesses',
  'Cost of Living', 'Household Income & Expenditure', 'Environment', 'Crime', 
  'Persons With Disabilities', 'Children', 'Bumiputera', 'Women Empowerment', 
  'ICT Use & Access', 'Well-Being', 'Sustainable Development Goals',
  'Monthly Reviews', 'Quarterly Reviews', 'Annual Reviews',

  /* --- BURSA / MARKET ANNOUNCEMENTS --- */
  // Financial & Audits
  'Quarterly report on consolidated results', 'Annual Audited Accounts', 'Annual Report',
  
  // Entitlements
  'Dividends', 'Bonus Issue', 'Right Issue', 'Share Split',
  
  // Shareholdings & Dealings
  'Changes in Substantial Shareholder Interest (Section 138)', 
  'Changes in Director Interest (Section 219)', 
  'Dealings in Listed Securities (Chapter 14)', 'Shares Buy-Back',
  
  // General Meetings
  'Notice of Meeting', 'Outcome of Meeting', 'Proxy Forms',
  
  // Corporate Information
  'Change of Address', 'Change of Company Secretary', 'Change in Boardroom', 
  'Change in Audit Committee', 'Change in Risk Committee',
  
  // Listing & IPO
  'Initial Public Offering (IPO)', 'Admission to LEAP Market', 
  'Additional Listing Announcement', 'Delisting of Securities', 'Transfer of Listing',
  
  // Proposals & Transactions
  'Memorandum of Understanding', 'Material Litigation', 'Multiple Proposals',
  'Transactions (Chapter 10)', 'Related Party Transactions',
  
  // Market Status
  'Unusual Market Activity (UMA)', 'Reply to Query', 'Investor Alert',
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
  // DOSM Publication Pillars
  'Population & Demography',
  'Census',
  'National Accounts',
  'Prices',
  'Labour',
  'Economy',
  'Society',
  'Statistical Reviews',
  
  // Bursa Malaysia Announcement Categories
  'Financial Results',
  'Annual Reports & Audited Accounts',
  'Entitlements',
  'Changes in Shareholdings',
  'Corporate Information',
  'General Meetings',
  'Listing & Quotation',
  'Corporate Exercises & Proposals',
  'Trading & Market Updates',
] as const
