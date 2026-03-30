import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
const API_KEY = Deno.env.get('CLOUDINARY_API_KEY')!;
const API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ✅ التحقق من وجود الـ token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ✅ التحقق من صلاحية الـ JWT فعلياً
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!
        );
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        );
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { public_id } = await req.json();
        if (!public_id || typeof public_id !== 'string') {
            return new Response(JSON.stringify({ error: 'Missing or invalid public_id' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const encoder = new TextEncoder();
        const str = `public_id=${public_id}&timestamp=${timestamp}${API_SECRET}`;
        const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(str));
        const signature = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        const formData = new FormData();
        formData.append('public_id', public_id);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
            { method: 'POST', body: formData }
        );

        const result = await response.json();
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.ok ? 200 : 500,
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
