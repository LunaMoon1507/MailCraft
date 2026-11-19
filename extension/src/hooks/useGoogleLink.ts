import { useSession } from '@/context/SessionContext';

// Whether a Google (Gmail) account is linked, shared app-wide:
// { linked, checking, error, link, unlink }.
export function useGoogleLink() {
  return useSession().google;
}
