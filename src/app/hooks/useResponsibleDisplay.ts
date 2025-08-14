import { useCallback } from 'react';
import { useTechnicians } from './useTechnicians';

/**
 * Hook to convert responsible field (userId) to display name
 */
export const useResponsibleDisplay = () => {
  const { technicians, getTechnicianDisplayName } = useTechnicians();

  const getResponsibleDisplayName = useCallback((responsible?: string) => {
    if (!responsible?.trim()) return 'Unassigned';
    
    // If it looks like a userId (UUID format), convert to display name
    if (responsible.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const tech = technicians.find(t => t.userId === responsible);
      if (tech) {
        return getTechnicianDisplayName(tech);
      }
      // User ID not found in technicians database
      console.warn(`⚠️ [RESPONSIBLE] User ID not found in technicians database: ${responsible}`);
      return '-';
    }
    
    // Legacy: if it's already a display name, return as-is
    return responsible;
  }, [technicians, getTechnicianDisplayName]);

  const getResponsibleUserId = useCallback((responsible?: string) => {
    if (!responsible?.trim()) return '';
    
    // If it's already a userId, return as-is
    if (responsible.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return responsible;
    }
    
    // Legacy: try to convert display name to userId
    const tech = technicians.find(t => getTechnicianDisplayName(t) === responsible);
    return tech ? tech.userId : responsible;
  }, [technicians, getTechnicianDisplayName]);

  return {
    getResponsibleDisplayName,
    getResponsibleUserId
  };
};
