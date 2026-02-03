/**
 * Facebook Feed Fetcher for Cloudflare Pages
 * Fetches posts from a Facebook Page using Graph API
 */

export async function onRequest(context) {
    const { request, env } = context;
    
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const url = new URL(request.url);
        const pageId = url.searchParams.get('pageId') || '61550821937890';
        
        // Get access token from environment variables
        const accessToken = env.FACEBOOK_ACCESS_TOKEN;
        
        if (!accessToken) {
            return new Response(JSON.stringify({
                error: 'Facebook Access Token not configured',
                setup_instructions: 'Set FACEBOOK_ACCESS_TOKEN in Cloudflare Pages settings'
            }), { 
                status: 500, 
                headers: corsHeaders 
            });
        }

        // Fetch posts from Facebook Graph API
        const fbApiUrl = `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url,attachments{media,type,url}&access_token=${accessToken}&limit=10`;
        
        const response = await fetch(fbApiUrl);
        const data = await response.json();

        if (data.error) {
            return new Response(JSON.stringify({
                error: 'Facebook API Error',
                details: data.error,
                hint: 'Check your access token and page permissions'
            }), { 
                status: 500, 
                headers: corsHeaders 
            });
        }

        // Transform posts into a cleaner format
        const posts = (data.data || []).map(post => ({
            id: post.id,
            message: post.message || '',
            created_time: post.created_time,
            image: post.full_picture || (post.attachments?.data?.[0]?.media?.image?.src),
            link: post.permalink_url,
            type: post.attachments?.data?.[0]?.type || 'status'
        }));

        return new Response(JSON.stringify({
            success: true,
            count: posts.length,
            posts: posts,
            cached_at: new Date().toISOString()
        }), { 
            status: 200, 
            headers: {
                ...corsHeaders,
                'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Server Error',
            message: error.message
        }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }
}
