import { useMachineContext } from '@/app/state/MachineProvider';

// Re-export types from the provider for convenience
export type { 
  Machine,
  MachineBasic,
  MachineFilters,
  MachinePagination,
  Task 
} from '@/app/state/MachineProvider';

export const useMachines = () => {
  return useMachineContext();
}; 