/**
 * Rate Limiting Utility for Report Submissions
 * Tracks submissions per session_token or logged-in community user ID.
 */

const STORAGE_KEY = 'nss_report_submissions_history';
const ONE_HOUR_MS = 60 * 60 * 1000;

// Maximum reports allowed per hour:
// 5 for anonymous devices (tied to session_token)
// 8 for verified community members
export const ANON_RATE_LIMIT = 5;
export const MEMBER_RATE_LIMIT = 8;

interface SubmissionRecord {
  key: string;
  timestamp: number;
}

function getSubmissionRecords(): SubmissionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cutoff = Date.now() - ONE_HOUR_MS;
      return parsed.filter((r) => typeof r.timestamp === 'number' && r.timestamp > cutoff);
    }
  } catch {}
  return [];
}

function saveSubmissionRecords(records: SubmissionRecord[]) {
  try {
    const cutoff = Date.now() - ONE_HOUR_MS;
    const filtered = records.filter((r) => r.timestamp > cutoff);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Checks if the given session token or user ID has exceeded the hourly submission rate limit.
 */
export function checkReportRateLimit(
  identifier: string,
  isLoggedInMember: boolean = false
): { allowed: boolean; remaining: number; resetMinutes: number; message?: string } {
  if (!identifier) {
    return { allowed: true, remaining: ANON_RATE_LIMIT, resetMinutes: 60 };
  }

  const limit = isLoggedInMember ? MEMBER_RATE_LIMIT : ANON_RATE_LIMIT;
  const records = getSubmissionRecords();
  const userRecords = records.filter((r) => r.key === identifier);

  if (userRecords.length >= limit) {
    const oldest = Math.min(...userRecords.map((r) => r.timestamp));
    const waitMs = Math.max(0, oldest + ONE_HOUR_MS - Date.now());
    const resetMinutes = Math.max(1, Math.ceil(waitMs / (60 * 1000)));

    return {
      allowed: false,
      remaining: 0,
      resetMinutes,
      message: "You've submitted several reports recently — please wait a bit before submitting more.",
    };
  }

  return {
    allowed: true,
    remaining: limit - userRecords.length,
    resetMinutes: 60,
  };
}

/**
 * Records a successful report submission under the given identifier.
 */
export function recordReportSubmission(identifier: string) {
  if (!identifier) return;
  const records = getSubmissionRecords();
  records.push({
    key: identifier,
    timestamp: Date.now(),
  });
  saveSubmissionRecords(records);
}
