import { auth } from './api';

// ImageKit links expire, so request a fresh one when the person opens the file.
export async function openResume(userId) {
  const tab = window.open('about:blank', '_blank');
  if (tab) tab.opener = null;
  try {
    const response = await auth('profiles/' + encodeURIComponent(userId));
    const url = response.data?.resumeUrl;
    if (!url) throw new Error('This résumé is no longer available. Refresh the profile and try again.');
    if (tab) tab.location.replace(url);
    else location.assign(url);
  } catch (error) {
    tab?.close();
    throw error;
  }
}
