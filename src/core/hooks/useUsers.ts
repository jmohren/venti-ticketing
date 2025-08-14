import { useUsersContext } from '@/core/state/UsersProvider';

export const useUsers = () => {
  return useUsersContext();
};


