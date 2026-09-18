import { supabase, isSupabaseConfigured } from './supabase';
export { supabase, isSupabaseConfigured };
import { Problem, ProblemCategory, ProblemStatus, ProgressUpdate, ProvisionedVolunteer, VolunteerRosterMember } from '../types';

// Map UI category to DB enum
export function toDbCategory(category: string): 'garbage' | 'water' | 'streetlights' | 'roads' | 'greenery' | 'school' | 'accessibility' | 'other' {
  const lower = (category || '').toLowerCase().trim();
  if (lower.includes('garb') || lower.includes('trash') || lower.includes('sanitat')) return 'garbage';
  if (lower.includes('water')) return 'water';
  if (lower.includes('light') || lower.includes('electr')) return 'streetlights';
  if (lower.includes('road') || lower.includes('pothol')) return 'roads';
  if (lower.includes('green') || lower.includes('tree') || lower.includes('park')) return 'greenery';
  if (lower.includes('school')) return 'school';
  if (lower.includes('access')) return 'accessibility';
  return 'other';
}

// Map DB category to UI display
export function toUiCategory(dbCategory: string): ProblemCategory {
  switch (dbCategory) {
    case 'garbage': return 'Garbage';
    case 'water': return 'Water';
    case 'streetlights': return 'Streetlights';
    case 'roads': return 'Roads';
    case 'greenery': return 'Greenery';
    case 'school': return 'School';
    case 'accessibility': return 'Accessibility';
    default: return 'Other';
  }
}

// Map DB status to UI status
export function toUiStatus(dbStatus: string): ProblemStatus {
  switch (dbStatus) {
    case 'in_progress': return 'IN_PROGRESS';
    case 'solved': return 'SOLVED';
    default: return 'REPORTED';
  }
}

// Map UI status to DB status
export function toDbStatus(uiStatus: ProblemStatus): 'reported' | 'in_progress' | 'solved' | 'rejected' {
  switch (uiStatus) {
    case 'IN_PROGRESS': return 'in_progress';
    case 'SOLVED': return 'solved';
    default: return 'reported';
  }
}

/**
 * Upload an image file to Supabase Storage `report-photos` bucket
 */
export async function uploadReportPhoto(file: File | Blob, prefix = 'reports'): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { url: null, error: 'Supabase is not configured' };
  }

  // Validate type
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (file.type && !allowedMime.includes(file.type)) {
    return { url: null, error: 'Only image files (JPEG, PNG, WebP, GIF) are allowed.' };
  }

  // Validate size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: 'Image size exceeds the 10MB limit.' };
  }

  const fileExt = file.type ? file.type.split('/')[1] || 'jpg' : 'jpg';
  const fileName = `${prefix}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  try {
    const { data, error } = await supabase.storage
      .from('report-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('report-photos')
      .getPublicUrl(fileName);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url: null, error: msg };
  }
}

/**
 * Fetch all problems from Supabase, joined with teams, actions, and counts
 */
export async function fetchAllProblems(): Promise<{ data: Problem[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase not configured' };
  }

  try {
    // 1. Fetch problems
    const { data: rawProblems, error: probError } = await supabase
      .from('problems')
      .select(`
        *,
        teams (
          id,
          assigned_by,
          team_members (
            volunteer_id,
            role,
            volunteers (
              id,
              name,
              volunteer_id,
              college_unit
            )
          )
        ),
        actions (
          id,
          description,
          photo_url,
          photo_type,
          logged_by,
          created_at,
          volunteers (
            name,
            volunteer_id
          )
        ),
        upvotes (
          id,
          session_token,
          community_user_id
        ),
        adoptions (
          id,
          session_token,
          community_user_id
        )
      `)
      .order('created_at', { ascending: false });

    if (probError) {
      console.error('Error fetching problems:', probError);
      return { data: [], error: probError.message };
    }

    const mapped: Problem[] = (rawProblems || []).map((p: any) => {
      // Find assigned team & lead volunteer
      const primaryTeam = p.teams && p.teams.length > 0 ? p.teams[0] : null;
      let leadName: string | undefined = undefined;
      let leadVolId: string | undefined = undefined;
      const assignedVolunteerNames: string[] = [];

      if (primaryTeam && primaryTeam.team_members) {
        for (const tm of primaryTeam.team_members) {
          if (tm.volunteers) {
            assignedVolunteerNames.push(tm.volunteers.name);
            if (tm.role === 'leader' || !leadName) {
              leadName = tm.volunteers.name;
              leadVolId = tm.volunteers.volunteer_id;
            }
          }
        }
      }

      // Map actions to ProgressUpdate
      const updates: ProgressUpdate[] = (p.actions || []).map((a: any) => ({
        id: a.id,
        author: a.volunteers?.name || 'NSS Volunteer Cadre',
        role: 'NSS Cadet',
        timestamp: new Date(a.created_at).toLocaleString(),
        description: a.description,
        photoUrl: a.photo_url || undefined,
        tag: a.photo_type === 'before' ? 'BEFORE EVIDENCE' : a.photo_type === 'after' ? 'RESOLUTION PROOF' : 'WORK IN PROGRESS',
      }));

      // Find before / after photos from actions
      const beforeAction = (p.actions || []).find((a: any) => a.photo_type === 'before');
      const afterAction = (p.actions || []).find((a: any) => a.photo_type === 'after');

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: toUiCategory(p.category),
        status: toUiStatus(p.status),
        location: p.location_text,
        landmark: p.landmark || undefined,
        coordinates: p.lat && p.lng ? { lat: Number(p.lat), lng: Number(p.lng) } : undefined,
        createdAt: new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        urgent: Boolean(p.is_urgent),
        anonymous: !p.reported_by_user_id,
        reportedByUserId: p.reported_by_user_id || undefined,
        photoUrl: p.photo_url || undefined,
        beforePhotoUrl: beforeAction?.photo_url || p.photo_url || undefined,
        solvedPhotoUrl: afterAction?.photo_url || undefined,
        upvotes: p.upvote_count || (p.upvotes?.length ?? 0),
        adoptersCount: p.adoptions?.length ?? 0,
        assignedSquad: primaryTeam ? 'NSS Civic Cadre' : undefined,
        assignedLead: leadName,
        assignedVolunteers: assignedVolunteerNames.length > 0 ? assignedVolunteerNames : undefined,
        assignedToVolunteerId: leadVolId,
        assignedBy: primaryTeam?.assigned_by || null,
        assignmentStatus: primaryTeam ? 'ACCEPTED' : 'PENDING',
        updates,
        comments: [],
        linkedDuplicatesCount: p.linked_reports_count || 0,
      };
    });

    return { data: mapped, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: [], error: msg };
  }
}

/**
 * Report a new problem or detect duplicate at database level
 */
export async function createProblemInDb(params: {
  title: string;
  description: string;
  category: ProblemCategory;
  location: string;
  landmark?: string;
  urgent: boolean;
  anonymous: boolean;
  photoUrl?: string;
  reportedByUserId?: string | null;
}): Promise<{ success: boolean; duplicateLinked: boolean; problemId: string; error?: string }> {
  try {
    const dbCategory = toDbCategory(params.category);

    // Step 6: Database-level duplicate detection
    const { data: dupId, error: rpcErr } = await supabase.rpc('detect_and_link_duplicate', {
      p_title: params.title.trim(),
      p_description: params.description.trim(),
      p_category: dbCategory,
      p_location_text: params.location.trim(),
    });

    if (!rpcErr && dupId) {
      return {
        success: true,
        duplicateLinked: true,
        problemId: String(dupId),
      };
    }

    // Insert new problem row
    const { data: newProb, error: insertErr } = await supabase
      .from('problems')
      .insert({
        title: params.title.trim(),
        description: params.description.trim(),
        category: dbCategory,
        location_text: params.location.trim(),
        landmark: params.landmark?.trim() || null,
        is_urgent: Boolean(params.urgent),
        photo_url: params.photoUrl || null,
        reported_by_user_id: params.anonymous ? null : params.reportedByUserId || null,
        status: 'reported',
      })
      .select('id')
      .single();

    if (insertErr || !newProb) {
      return {
        success: false,
        duplicateLinked: false,
        problemId: '',
        error: insertErr?.message || 'Failed to submit problem report.',
      };
    }

    // If a photo was supplied, also record it as an initial 'before' action
    if (params.photoUrl) {
      await supabase.from('actions').insert({
        problem_id: newProb.id,
        description: 'Initial photographic evidence submitted with civic report.',
        photo_url: params.photoUrl,
        photo_type: 'before',
      });
    }

    return {
      success: true,
      duplicateLinked: false,
      problemId: newProb.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, duplicateLinked: false, problemId: '', error: msg };
  }
}

/**
 * Assign a problem to a volunteer team (Coordinator action)
 */
export async function assignProblemInDb(params: {
  problemId: string;
  volunteerId: string; // auth uuid of volunteer
  coordinatorId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Create team
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({
        problem_id: params.problemId,
        assigned_by: params.coordinatorId,
      })
      .select('id')
      .single();

    if (teamErr || !team) {
      return { success: false, error: teamErr?.message || 'Failed to create team assignment.' };
    }

    // 2. Add team member
    const { error: tmErr } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        volunteer_id: params.volunteerId,
        role: 'leader',
      });

    if (tmErr) {
      return { success: false, error: tmErr.message };
    }

    // The database trigger `auto_update_problem_in_progress` automatically changes status to 'in_progress'
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Self-claim an unassigned problem (Volunteer action)
 */
export async function selfClaimProblemInDb(params: {
  problemId: string;
  volunteerId: string; // auth uuid of volunteer
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Create team without assigned_by
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({
        problem_id: params.problemId,
        assigned_by: null,
      })
      .select('id')
      .single();

    if (teamErr || !team) {
      return { success: false, error: teamErr?.message || 'Failed to claim task.' };
    }

    // 2. Add self as leader
    const { error: tmErr } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        volunteer_id: params.volunteerId,
        role: 'leader',
      });

    if (tmErr) {
      return { success: false, error: tmErr.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Log an action / progress update (Volunteer action)
 */
export async function logActionInDb(params: {
  problemId: string;
  description: string;
  photoUrl: string;
  photoType: 'before' | 'after' | 'progress';
  volunteerId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('actions').insert({
      problem_id: params.problemId,
      description: params.description,
      photo_url: params.photoUrl,
      photo_type: params.photoType,
      logged_by: params.volunteerId || null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Mark a problem as solved with before and after photo proof.
 * Database trigger `check_solved_photo_requirements` ensures at least 1 'before' and 1 'after' photo exist!
 */
export async function resolveProblemInDb(params: {
  problemId: string;
  solvedPhotoUrl: string;
  beforePhotoUrl?: string;
  impactMetrics?: string;
  volunteerId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Ensure a 'before' photo exists in actions
    if (params.beforePhotoUrl) {
      const { data: existingBefore } = await supabase
        .from('actions')
        .select('id')
        .eq('problem_id', params.problemId)
        .eq('photo_type', 'before')
        .limit(1);

      if (!existingBefore || existingBefore.length === 0) {
        await supabase.from('actions').insert({
          problem_id: params.problemId,
          description: 'Initial condition documentation.',
          photo_url: params.beforePhotoUrl,
          photo_type: 'before',
          logged_by: params.volunteerId || null,
        });
      }
    }

    // 2. Insert the 'after' photo in actions
    const { error: afterErr } = await supabase.from('actions').insert({
      problem_id: params.problemId,
      description: params.impactMetrics || 'Civic drive completed and resolved.',
      photo_url: params.solvedPhotoUrl,
      photo_type: 'after',
      logged_by: params.volunteerId || null,
    });

    if (afterErr) {
      return { success: false, error: afterErr.message };
    }

    // 3. Update problem status to 'solved'
    const { error: updateErr } = await supabase
      .from('problems')
      .update({
        status: 'solved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', params.problemId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch roster of all volunteers from public.volunteers
 */
export async function fetchVolunteersFromDb(): Promise<{ data: ProvisionedVolunteer[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const mapped: ProvisionedVolunteer[] = (data || []).map((v: any) => ({
      id: v.volunteer_id,
      name: v.name,
      unit: v.college_unit || 'Ward 4 Youth Wing',
      role: 'NSS Cadet',
      email: `${v.volunteer_id.toLowerCase()}@nss.internal`,
      status: v.status === 'active' ? 'ACTIVE' : 'SUSPENDED',
      dateProvisioned: new Date(v.created_at).toLocaleDateString(),
      hoursCompleted: v.hours_completed || 0,
      civicWins: 0,
    }));

    return { data: mapped, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: [], error: msg };
  }
}

/**
 * Fetch single volunteer record by auth user id or volunteer_id
 */
export async function fetchVolunteerRecord(identifier: string) {
  try {
    const query = identifier.includes('-')
      ? supabase.from('volunteers').select('*').eq('volunteer_id', identifier).single()
      : supabase.from('volunteers').select('*').eq('id', identifier).single();

    const { data, error } = await query;
    return { volunteer: data, error: error?.message || null };
  } catch (err: unknown) {
    return { volunteer: null, error: String(err) };
  }
}

/**
 * Upvote toggle
 */
export async function toggleUpvoteInDb(problemId: string, userId?: string | null, sessionToken?: string): Promise<boolean> {
  try {
    const token = sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('nss_session_token') || 'anon-session' : 'anon-session');
    
    // Check if upvote exists
    let query = supabase.from('upvotes').select('id').eq('problem_id', problemId);
    if (userId) {
      query = query.eq('community_user_id', userId);
    } else {
      query = query.eq('session_token', token);
    }

    const { data: existing } = await query.limit(1);

    if (existing && existing.length > 0) {
      // Delete upvote
      await supabase.from('upvotes').delete().eq('id', existing[0].id);
      return false;
    } else {
      // Insert upvote
      await supabase.from('upvotes').insert({
        problem_id: problemId,
        community_user_id: userId || null,
        session_token: userId ? null : token,
      });
      return true;
    }
  } catch (err) {
    console.error('toggleUpvoteInDb error:', err);
    return false;
  }
}

/**
 * Adoption toggle
 */
export async function toggleAdoptionInDb(problemId: string, userId?: string | null, sessionToken?: string): Promise<boolean> {
  try {
    const token = sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('nss_session_token') || 'anon-session' : 'anon-session');

    let query = supabase.from('adoptions').select('id').eq('problem_id', problemId);
    if (userId) {
      query = query.eq('community_user_id', userId);
    } else {
      query = query.eq('session_token', token);
    }

    const { data: existing } = await query.limit(1);

    if (existing && existing.length > 0) {
      await supabase.from('adoptions').delete().eq('id', existing[0].id);
      return false;
    } else {
      await supabase.from('adoptions').insert({
        problem_id: problemId,
        community_user_id: userId || null,
        session_token: userId ? null : token,
      });
      return true;
    }
  } catch (err) {
    console.error('toggleAdoptionInDb error:', err);
    return false;
  }
}
