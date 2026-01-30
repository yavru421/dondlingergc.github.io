export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        // Accept multipart/form-data or JSON
        const contentType = request.headers.get('content-type') || '';
        let body;
        let headers = {
            'Authorization': `Bearer ${env.HF_API_KEY}`
        };

        if (contentType.includes('multipart/form-data')) {
            body = request.body;
            // Let fetch pass through the form-data as-is
        } else if (contentType.includes('application/json')) {
            body = await request.text();
            headers['Content-Type'] = 'application/json';
        } else {
            return new Response('Unsupported Content-Type', { status: 415 });
        }

        // Proxy to Hugging Face Inference API
        const response = await fetch('https://api-inference.huggingface.co/models/llava-hf/llava-1.5-7b-hf', {
            method: 'POST',
            headers,
            body
        });

        // Pass through response
        return new Response(response.body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type'),
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
