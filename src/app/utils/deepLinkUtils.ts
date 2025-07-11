/**
 * Utility functions for generating deep links to specific worklines and PDCA entries
 */

export interface DeepLinkParams {
  workline?: string;
  pdca?: number;
}

/**
 * Generate a deep link URL for a specific view with optional workline and PDCA entry
 */
export const generateDeepLink = (
  view: 'daily-routine' | 'analytics',
  params: DeepLinkParams = {}
): string => {
  const baseUrl = window.location.origin;
  const viewPath = view === 'daily-routine' ? '/daily-routine' : '/analytics';
  
  const searchParams = new URLSearchParams();
  
  if (params.workline) {
    searchParams.set('workline', params.workline);
  }
  
  if (params.pdca) {
    searchParams.set('pdca', params.pdca.toString());
  }
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}${viewPath}?${queryString}` : `${baseUrl}${viewPath}`;
};

/**
 * Generate a deep link specifically for a PDCA entry
 */
export const generatePDCADeepLink = (
  workline: string,
  pdcaId: number,
  view: 'daily-routine' | 'analytics' = 'daily-routine'
): string => {
  return generateDeepLink(view, { workline, pdca: pdcaId });
};

/**
 * Generate a deep link specifically for a workline
 */
export const generateWorklineDeepLink = (
  workline: string,
  view: 'daily-routine' | 'analytics' = 'daily-routine'
): string => {
  return generateDeepLink(view, { workline });
};

/**
 * Parse deep link parameters from current URL
 */
export const parseDeepLinkParams = (): DeepLinkParams => {
  const searchParams = new URLSearchParams(window.location.search);
  
  const params: DeepLinkParams = {};
  
  const workline = searchParams.get('workline');
  if (workline) {
    params.workline = workline;
  }
  
  const pdca = searchParams.get('pdca');
  if (pdca) {
    const pdcaId = parseInt(pdca, 10);
    if (!isNaN(pdcaId)) {
      params.pdca = pdcaId;
    }
  }
  
  return params;
};

/**
 * Copy a deep link to clipboard
 */
export const copyDeepLinkToClipboard = async (
  view: 'daily-routine' | 'analytics',
  params: DeepLinkParams = {}
): Promise<boolean> => {
  try {
    const link = generateDeepLink(view, params);
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Failed to copy link to clipboard:', error);
    return false;
  }
};

/**
 * Copy PDCA deep link to clipboard
 */
export const copyPDCALinkToClipboard = async (
  workline: string,
  pdcaId: number,
  view: 'daily-routine' | 'analytics' = 'daily-routine'
): Promise<boolean> => {
  return copyDeepLinkToClipboard(view, { workline, pdca: pdcaId });
}; 