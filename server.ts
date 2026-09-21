import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// Initialize Supabase Admin with Service Role Key (server-side only, never in client)
const rawUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isServerConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  !supabaseUrl.includes('placeholder')
);

const supabaseAdmin = createClient(
  isServerConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isServerConfigured ? serviceRoleKey : 'placeholder-service-role-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Helper to authenticate coordinator requests
async function getAuthenticatedCoordinator(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  // Check public.coordinators
  const { data: coord } = await supabaseAdmin
    .from('coordinators')
    .select('*')
    .eq('id', user.id)
    .single();

  return coord ? { user, coord } : null;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supabaseConnected: Boolean(supabaseUrl && serviceRoleKey),
  });
});

// In-memory rate limiting and cache for OpenStreetMap Nominatim reverse geocoding
let lastNominatimTimestamp = 0;
const geocodeCache = new Map<string, any>();

app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const latStr = String(req.query.lat || '').trim();
    const lngStr = String(req.query.lng || req.query.lon || '').trim();

    if (!latStr || !lngStr) {
      return res.status(400).json({ error: 'lat and lng parameters are required.' });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid lat or lng coordinate values.' });
    }

    // Cache key rounded to ~10 meters precision
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
      return res.json(geocodeCache.get(cacheKey));
    }

    // Nominatim Usage Policy: Limit requests to roughly 1 per second
    const now = Date.now();
    const timeSinceLast = now - lastNominatimTimestamp;
    if (timeSinceLast < 1050) {
      await new Promise((resolve) => setTimeout(resolve, 1050 - timeSinceLast));
    }
    lastNominatimTimestamp = Date.now();

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&email=24r01a05q2@cmrithyderabad.edu.in`;

    const response = await fetch(nominatimUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'NSS-Community-Corkboard/1.0 (contact: 24r01a05q2@cmrithyderabad.edu.in)',
        'Referer': 'https://ais-pre-77yd6uvgwj24z5hai3dv6q-478376019499.asia-southeast1.run.app',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Nominatim geocoding failed with status ${response.status}`,
      });
    }

    const data = (await response.json()) as any;
    const addr = data.address || {};
    const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path;
    const neighbourhood =
      addr.suburb || addr.neighbourhood || addr.residential || addr.subdivision || addr.village;
    const city = addr.city || addr.town || addr.municipality || addr.county;
    const parts = [road, neighbourhood, city].filter(Boolean);
    const formatted =
      parts.length > 0
        ? parts.join(', ')
        : (data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);

    const result = {
      display_name: data.display_name || formatted,
      formatted_address: formatted,
      road: road || null,
      neighbourhood: neighbourhood || null,
      city: city || null,
      lat,
      lng,
      raw: data,
    };

    geocodeCache.set(cacheKey, result);
    // Keep cache from growing unbounded
    if (geocodeCache.size > 200) {
      const firstKey = geocodeCache.keys().next().value;
      if (firstKey) geocodeCache.delete(firstKey);
    }

    return res.json(result);
  } catch (err: any) {
    console.warn('Reverse geocoding endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Geocoding failed' });
  }
});

/**
 * Step 3b: Volunteer Login
 * Authenticates using Volunteer ID ONLY.
 * Checks against public.volunteers table.
 * If status is 'suspended', BLOCKS login.
 */
app.post('/api/volunteer/login', async (req, res) => {
  try {
    const { volunteerId } = req.body;
    if (!volunteerId) {
      return res.status(400).json({ error: 'Volunteer ID is required.' });
    }

    const cleanId = String(volunteerId).trim();

    if (!isServerConfigured) {
      return res.status(503).json({ error: 'Database service is currently initializing.' });
    }

    // Query volunteers table by volunteer_id
    const { data: volunteer, error: volErr } = await supabaseAdmin
      .from('volunteers')
      .select('*')
      .ilike('volunteer_id', cleanId)
      .single();

    if (volErr || !volunteer) {
      return res.status(400).json({
        error: "This Volunteer ID isn't recognized — please check with your coordinator.",
      });
    }

    // Check status: strictly reject if suspended
    if (volunteer.status === 'suspended') {
      return res.status(403).json({
        error: "This Volunteer ID is suspended — please check with your coordinator.",
      });
    }

    return res.json({
      success: true,
      volunteer: {
        id: volunteer.id,
        name: volunteer.name,
        volunteer_id: volunteer.volunteer_id,
        college_unit: volunteer.college_unit,
        status: volunteer.status,
        hours_completed: volunteer.hours_completed,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

/**
 * Step 3b: Coordinator provisions a volunteer
 * Creates auth user + matching volunteers row with unique volunteer_id.
 * Server-side only via service role key.
 */
app.post('/api/coordinator/create-volunteer', async (req, res) => {
  try {
    const coordAuth = await getAuthenticatedCoordinator(req);
    // Allow either valid coordinator session OR initial setup if no coordinator exists
    if (!coordAuth) {
      return res.status(403).json({ error: 'Unauthorized: Only coordinators can provision volunteers.' });
    }

    const { name, collegeUnit, password, role, volunteerId } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and initial password are required.' });
    }

    // Determine target volunteer ID
    let uniqueId = volunteerId ? String(volunteerId).trim().toUpperCase() : '';
    if (uniqueId) {
      // Check if this volunteer already exists in volunteers table
      const { data: existingVol } = await supabaseAdmin
        .from('volunteers')
        .select('*')
        .eq('volunteer_id', uniqueId)
        .maybeSingle();

      if (existingVol) {
        // If the volunteer already exists, update their info rather than failing
        const { data: updatedVol, error: updateErr } = await supabaseAdmin
          .from('volunteers')
          .update({
            name: name.trim(),
            college_unit: collegeUnit || 'Ward 4 Civic Unit',
          })
          .eq('volunteer_id', uniqueId)
          .select('*')
          .single();

        if (updateErr) {
          return res.status(400).json({ error: updateErr.message });
        }

        return res.json({
          success: true,
          volunteer: updatedVol,
          generatedVolunteerId: uniqueId,
        });
      }
    } else {
      let isUnique = false;
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingEmails = new Set((userList?.users || []).map((u) => u.email?.toLowerCase()));
      while (!isUnique) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const candidate = `NSS-2026-ND-${randNum}`;
        const candidateEmail = `volunteer_${candidate.toLowerCase().replace(/[^a-z0-9]/g, '_')}@nss.internal`;
        const { data: existing } = await supabaseAdmin
          .from('volunteers')
          .select('id')
          .eq('volunteer_id', candidate)
          .maybeSingle();
        if (!existing && !existingEmails.has(candidateEmail)) {
          uniqueId = candidate;
          isUnique = true;
        }
      }
    }

    const internalEmail = `volunteer_${uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '_')}@nss.internal`;

    let authUserId: string | null = null;

    // 1. Create or retrieve auth user
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        role: 'volunteer',
        volunteer_id: uniqueId,
        unit: collegeUnit || 'Ward 4 Civic Unit',
      },
    });

    if (authErr) {
      if (authErr.message.includes('already been registered') || authErr.message.includes('already exists')) {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingAuth = userList?.users?.find((u) => u.email?.toLowerCase() === internalEmail.toLowerCase());
        if (existingAuth) {
          authUserId = existingAuth.id;
          await supabaseAdmin.auth.admin.updateUserById(existingAuth.id, {
            password: String(password),
            user_metadata: {
              name: name.trim(),
              role: 'volunteer',
              volunteer_id: uniqueId,
              unit: collegeUnit || 'Ward 4 Civic Unit',
            },
          });
        } else {
          return res.status(400).json({ error: authErr.message });
        }
      } else {
        return res.status(400).json({ error: authErr.message });
      }
    } else if (authUser?.user) {
      authUserId = authUser.user.id;
    }

    if (!authUserId) {
      return res.status(400).json({ error: 'Failed to create volunteer account.' });
    }

    // 2. Insert or update public.volunteers
    const { data: volRecord, error: volErr } = await supabaseAdmin
      .from('volunteers')
      .upsert(
        {
          id: authUserId,
          name: name.trim(),
          volunteer_id: uniqueId,
          college_unit: collegeUnit || 'Ward 4 Civic Unit',
          status: 'active',
          created_by_coordinator_id: coordAuth.coord.id,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (volErr) {
      return res.status(400).json({ error: volErr.message });
    }

    return res.json({
      success: true,
      volunteer: volRecord,
      generatedVolunteerId: uniqueId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

/**
 * Update volunteer status (Active / Suspended)
 */
app.post('/api/coordinator/update-volunteer-status', async (req, res) => {
  try {
    const coordAuth = await getAuthenticatedCoordinator(req);
    if (!coordAuth) {
      return res.status(403).json({ error: 'Unauthorized: Only coordinators can update volunteer status.' });
    }

    const { volunteerId, status } = req.body;
    if (!volunteerId || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid volunteer ID or status.' });
    }

    const { data, error } = await supabaseAdmin
      .from('volunteers')
      .update({ status })
      .eq('id', volunteerId)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, volunteer: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

/**
 * Step 3c: Coordinator Setup / Auto-Profile link
 * Allows coordinator who signs in with Supabase Auth to ensure their profile exists in public.coordinators
 */
app.post('/api/coordinator/verify-profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid session' });

    // Check if coordinator record exists
    const { data: existing } = await supabaseAdmin
      .from('coordinators')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existing) {
      return res.json({ coordinator: existing });
    }

    // Auto-create coordinator record if user was registered in Supabase Auth
    const officerId = user.user_metadata?.officer_id || `PO-${user.id.slice(0, 6).toUpperCase()}`;
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Programme Officer';

    const { data: newCoord, error: insertErr } = await supabaseAdmin
      .from('coordinators')
      .insert({
        id: user.id,
        name,
        officer_id: officerId,
        title: 'NSS Programme Officer',
        unit: 'Central Ward 4',
      })
      .select('*')
      .single();

    if (insertErr) return res.status(400).json({ error: insertErr.message });
    return res.json({ coordinator: newCoord });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

/**
 * Community User (Resident) Registration
 * Uses Supabase Admin to provision auth.users with email_confirm: true
 * and link to public.community_users.
 */
app.post('/api/community/register', async (req, res) => {
  try {
    const { fullName, email, password, phone, ward, location } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    const cleanPass = String(password).trim();
    const userLocation = String(location || ward || '').trim();

    if (cleanPass.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (!isServerConfigured) {
      // Local fallback mode
      const fallbackId = `00000000-0000-4000-8000-${Date.now().toString().padStart(12, '0')}`.slice(0, 36);
      return res.json({
        success: true,
        user: {
          id: fallbackId,
          email: cleanEmail,
          name: cleanName,
          location: userLocation,
          ward: userLocation,
        },
      });
    }

    // 1. Create auth user with service role (auto-confirmed to bypass email verification roadblocks)
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPass,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        phone: phone || '',
        ward: userLocation,
        location: userLocation,
      },
    });

    let userId: string;

    if (authErr) {
      const errMsg = (authErr.message || '').toLowerCase();
      if (
        (errMsg.includes('already') && (errMsg.includes('registered') || errMsg.includes('exist'))) ||
        errMsg.includes('already exists') ||
        (authErr as any).code === 'email_exists'
      ) {
        return res.status(400).json({
          error: 'An account with this email already exists. Please sign in.',
        });
      }
      return res.status(400).json({ error: authErr.message });
    } else if (authUser?.user) {
      userId = authUser.user.id;
    } else {
      return res.status(400).json({ error: 'Failed to create auth user.' });
    }

    // 2. Ensure matching record in public.community_users
    const { error: profileErr } = await supabaseAdmin
      .from('community_users')
      .upsert({
        id: userId,
        name: cleanName,
        email: cleanEmail,
      });

    if (profileErr) {
      console.warn('community_users profile insert notice:', profileErr.message);
    }

    return res.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        location: userLocation,
        ward: userLocation,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

/**
 * Community User Login
 */
app.post('/api/community/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();
    const cleanPass = String(password).trim();

    if (!isServerConfigured) {
      return res.status(400).json({ error: 'Database service is currently offline.' });
    }

    const client = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let emailToUse = cleanInput;

    // If input is not an email, lookup user by phone in user metadata
    if (!cleanInput.includes('@')) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const match = (users?.users || []).find(
        (u: any) =>
          u.user_metadata?.phone &&
          String(u.user_metadata.phone).replace(/[^0-9]/g, '') === cleanInput.replace(/[^0-9]/g, '')
      );
      if (match && match.email) {
        emailToUse = match.email;
      }
    }

    const { data: authData, error: signInErr } = await client.auth.signInWithPassword({
      email: emailToUse,
      password: cleanPass,
    });

    if (signInErr || !authData.session) {
      return res.status(401).json({
        error: signInErr?.message || 'Invalid email or password. Please try again.',
      });
    }

    // Fetch user profile from public.community_users
    const { data: profile } = await supabaseAdmin
      .from('community_users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const userLoc =
      authData.user.user_metadata?.location ||
      authData.user.user_metadata?.ward ||
      '';

    return res.json({
      success: true,
      session: authData.session,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
        location: userLoc,
        ward: userLoc,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

/**
 * Update Community Resident Location
 */
app.post('/api/community/update-location', async (req, res) => {
  try {
    const { userId, location } = req.body;
    if (!userId || !location) {
      return res.status(400).json({ error: 'userId and location are required.' });
    }
    const cleanLocation = String(location).trim();
    if (isServerConfigured) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { location: cleanLocation, ward: cleanLocation },
      });
    }
    return res.json({ success: true, location: cleanLocation, ward: cleanLocation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

/**
 * Clear all reports and pre-seeded sample data from database (0 count clean slate)
 */
app.post('/api/sample-data/clear', async (req, res) => {
  try {
    if (!isServerConfigured) {
      return res.json({ success: true, message: 'Local data reset to zero.' });
    }
    // Delete dependent tables first, then problems
    try { await supabaseAdmin.from('actions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch {}
    try { await supabaseAdmin.from('upvotes').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch {}
    try { await supabaseAdmin.from('adoptions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch {}
    try { await supabaseAdmin.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch {}
    try { await supabaseAdmin.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch {}

    const { error } = await supabaseAdmin
      .from('problems')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.warn('Clear problems warning:', error.message);
    }
    return res.json({ success: true, message: 'All reports and data wiped to zero.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

// Purge unwanted demo data on startup
async function purgeFalseData() {
  if (!isServerConfigured) return;
  try {
    const titles = [
      'Broken Streetlight',
      'Illegal Garbage Dumping',
      'Burst Drinking Water',
      'Severe Asphalt Caving',
      'Anonymous Pothole Flag',
      'trash bins',
    ];
    for (const title of titles) {
      await supabaseAdmin.from('problems').delete().ilike('title', `%${title}%`);
    }
  } catch (e) {
    console.warn('Startup purge note:', e);
  }
}

// -------------------------------------------------------------
// Vite Server Integration
// -------------------------------------------------------------
async function startServer() {
  await purgeFalseData();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: process.cwd(),
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express + Vite Server running on port ${PORT}`);
  });
}

startServer();
