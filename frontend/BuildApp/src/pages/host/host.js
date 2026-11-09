import { requireLogin } from '../../loginRedirect';

export const statusName = { DRAFT: 'Draft', PUBLISHED: 'Open', ARCHIVED: 'Entry closed' };
export const formatName = { LIVE: 'Live video', ASYNC: 'Assessment' };
export function hostPath(id) { return '/host/interviews/' + encodeURIComponent(id); }
export function problem(error) {
  if (error.status === 401) requireLogin();
  return error instanceof TypeError ? 'Connection interrupted. Please try again.' : error.message;
}

