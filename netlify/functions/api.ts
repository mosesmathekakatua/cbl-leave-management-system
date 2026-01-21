import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export const handler = async (event: any) => {
  const { httpMethod, path, body } = event;
  const payload = body ? JSON.parse(body) : {};

  // Normalize path more robustly
  // Handles cases where path might be /.netlify/functions/api/data or just /api/data
  let normalizedPath = path.replace(/^\/\.netlify\/functions\/api/, '');
  normalizedPath = normalizedPath.replace(/\/$/, '');
  if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
  
  console.log(`[CBL-API] ${httpMethod} Request to: ${normalizedPath}`);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 1. Fetch All System Data (Hydration)
    if (httpMethod === 'GET' && (normalizedPath === '/data' || normalizedPath === '/')) {
      const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      const { data: requests } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
      const { data: logs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      const { data: notifications } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
      const { data: resets } = await supabase.from('reset_requests').select('*').order('created_at', { ascending: false });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          users: users || [], 
          requests: requests || [], 
          logs: logs || [], 
          notifications: notifications || [], 
          resets: resets || [] 
        }),
      };
    }

    // 2. Auth: Verify PIN
    if (httpMethod === 'POST' && normalizedPath === '/auth/verify') {
      const { name, pin } = payload;
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .eq('pin', pin)
        .single();

      if (error || !user) {
        return { 
          statusCode: 401, 
          headers,
          body: JSON.stringify({ error: 'Unauthorized credentials' }) 
        };
      }

      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
      
      return { 
        statusCode: 200, 
        headers,
        body: JSON.stringify(user) 
      };
    }

    // 3. Sync Action
    if (httpMethod === 'POST' && normalizedPath === '/sync') {
      const { type, data } = payload;
      let success = true;
      
      switch (type) {
        case 'REGISTER':
          await supabase.from('users').insert([data]);
          break;
        case 'ADD_REQUEST':
          await supabase.from('leave_requests').insert([data]);
          break;
        case 'UPDATE_REQUEST':
          await supabase.from('leave_requests').update(data.updates).eq('id', data.id);
          break;
        case 'UPDATE_USER':
          await supabase.from('users').update(data.updates).eq('id', data.id);
          break;
        case 'DELETE_USER':
          await supabase.from('users').delete().eq('id', data.id);
          break;
        case 'DELETE_NOTIFICATION':
          await supabase.from('notifications').delete().eq('id', data.id);
          break;
        case 'UPDATE_RESET':
          await supabase.from('reset_requests').update({ status: 'RESOLVED' }).eq('id', data.id);
          break;
        default:
          success = false;
      }

      return { 
        statusCode: success ? 200 : 400, 
        headers,
        body: JSON.stringify({ success, type }) 
      };
    }

    return { 
      statusCode: 404, 
      headers,
      body: JSON.stringify({ error: 'Endpoint not found', path: normalizedPath }) 
    };
  } catch (err: any) {
    console.error(`[CBL-API] Internal Error:`, err);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }) 
    };
  }
};