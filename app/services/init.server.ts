import { ensureRoles } from './roles.server';

let initialized = false;

export async function initializeServices() {
    if (initialized) return;
    
    try {
        // Ensure roles exist
        await ensureRoles();
        
        // Add other initialization tasks here
        
        initialized = true;
        console.log('Services initialized successfully');
    } catch (error) {
        console.error('Failed to initialize services:', error);
        throw error;
    }
}
