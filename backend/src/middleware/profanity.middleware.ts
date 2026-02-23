import { Context, Next } from 'hono';

const BANNED_WORDS = ['badword1', 'badword2']; // Example

export const profanityFilter = async (c: Context, next: Next) => {
    if (c.req.method === 'POST' || c.req.method === 'PUT') {
        try {
            const body = await c.req.json();
            const content = JSON.stringify(body).toLowerCase();

            if (BANNED_WORDS.some(word => content.includes(word))) {
                return c.json({ error: 'Profanity detected' }, 400);
            }
        } catch (e) {
            // Ignore if not JSON
        }
    }
    await next();
};
