import { useAppContext } from "../context/auth_context";
export const useApp = () => {
  return useAppContext();
};