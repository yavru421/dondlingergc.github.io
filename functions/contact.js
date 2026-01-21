export async function onRequestPost({ request, env }) {
    try {
        const formData = await request.formData();
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        // Insert into D1 database
        const { success } = await env.DB.prepare(
            'INSERT INTO contacts (name, email, message, created_at) VALUES (?, ?, ?, ?)'
        ).bind(name, email, message, new Date().toISOString()).run();

        if (success) {
            return new Response('Message sent successfully!', { status: 200 });
        } else {
            return new Response('Failed to send message.', { status: 500 });
        }
    } catch (error) {
        console.error(error);
        return new Response('Error: ' + error.message, { status: 500 });
    }
}