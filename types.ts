export interface CsvRow {
  [key: string]: string;
}

export interface XFConfig {
  baseUrl: string;
  apiKey: string;
  categoryId: number;
  userId: number; // The user ID to post as (XF-Api-User)
  allowCorsProxy: boolean; // In case they need a proxy for local dev
  proxyUrl: string; // Custom proxy URL (e.g., https://corsproxy.io/?)
}

export enum XFField {
  TITLE = 'title',
  TAG_LINE = 'tag_line',
  DESCRIPTION = 'description',
  VERSION = 'version_string',
  EXTERNAL_URL = 'external_purchase_url',
  PRICE = 'price',
  CURRENCY = 'currency',
}

export interface FieldMapping {
  [XFField.TITLE]: string; // Maps to CSV Header
  [XFField.TAG_LINE]: string;
  [XFField.DESCRIPTION]: string;
  [XFField.VERSION]: string;
  [XFField.EXTERNAL_URL]: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending' | 'info';
  message: string;
  details?: string;
}

export interface ImportStats {
  total: number;
  success: number;
  failed: number;
  processed: number;
}