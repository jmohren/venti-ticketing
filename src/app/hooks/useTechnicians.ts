import { useTechnicianContext } from '@/app/state/TechnicianProvider';

// Re-export types from the provider for convenience
export type { 
  Technician 
} from '@/app/state/TechnicianProvider';

export const useTechnicians = () => {
  return useTechnicianContext();
}; 