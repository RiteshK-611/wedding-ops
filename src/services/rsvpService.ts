import { supabase } from '../lib/supabaseClient';
import type { Tables } from '../types/supabase';

type Guest = Tables<'guests'>;
type Event = Tables<'events'>;
type EventRsvp = Tables<'event_rsvps'>;

/**
 * Generate the public RSVP URL for a guest
 */
export function getGuestRsvpUrl(rsvpToken: string): string {
    return `${window.location.origin}/rsvp/${rsvpToken}`;
}

/**
 * Fetch guest by RSVP token or ID (public access)
 * First tries to find by rsvp_token, then falls back to ID lookup
 */
export async function getGuestByToken(token: string): Promise<Guest | null> {
    // First try to find by rsvp_token
    const { data: tokenData, error: tokenError } = await supabase
        .from('guests')
        .select('*')
        .eq('rsvp_token', token)
        .maybeSingle();

    if (tokenData) {
        return tokenData;
    }

    // If not found by token, try by ID (for backwards compatibility)
    const { data: idData, error: idError } = await supabase
        .from('guests')
        .select('*')
        .eq('id', token)
        .maybeSingle();

    if (idError) {
        console.error('Error fetching guest by token/id:', idError);
        return null;
    }

    return idData;
}

/**
 * Fetch events for a wedding (for RSVP form)
 */
export async function getWeddingEvents(weddingId: string): Promise<Event[]> {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('event_date', { ascending: true });

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return data || [];
}

/**
 * Fetch wedding details (for RSVP form greeting)
 */
export async function getWeddingDetails(weddingId: string) {
    const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .eq('id', weddingId)
        .single();

    if (error) {
        console.error('Error fetching wedding:', error);
        return null;
    }

    return data;
}

/**
 * Fetch existing RSVP responses for a guest
 */
export async function getGuestRsvps(guestId: string): Promise<EventRsvp[]> {
    const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('guest_id', guestId);

    if (error) {
        console.error('Error fetching guest RSVPs:', error);
        return [];
    }

    return data || [];
}

/**
 * Submit RSVP response
 */
export async function submitRsvp(
    guestId: string,
    responses: { eventId: string; status: 'yes' | 'no' | 'maybe' }[],
    guestData: {
        dietaryRestrictions?: string[];
        accessibilityNeeds?: string;
        arrivalDate?: string;
        departureDate?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update guest info
        const { error: guestError } = await supabase
            .from('guests')
            .update({
                dietary_restrictions: guestData.dietaryRestrictions || [],
                accessibility_needs: guestData.accessibilityNeeds || null,
                arrival_date: guestData.arrivalDate || null,
                departure_date: guestData.departureDate || null,
                global_rsvp_status: determineGlobalStatus(responses),
            })
            .eq('id', guestId);

        if (guestError) throw guestError;

        // Upsert event RSVPs
        for (const response of responses) {
            const { error: rsvpError } = await supabase
                .from('event_rsvps')
                .upsert({
                    guest_id: guestId,
                    event_id: response.eventId,
                    status: response.status,
                    responded_at: new Date().toISOString(),
                }, {
                    onConflict: 'guest_id,event_id',
                });

            if (rsvpError) throw rsvpError;
        }

        return { success: true };
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit RSVP'
        };
    }
}

/**
 * Determine global RSVP status based on event responses
 */
function determineGlobalStatus(
    responses: { status: 'yes' | 'no' | 'maybe' }[]
): 'yes' | 'no' | 'maybe' | 'pending' {
    if (responses.length === 0) return 'pending';

    const hasYes = responses.some(r => r.status === 'yes');
    const hasNo = responses.some(r => r.status === 'no');
    const hasMaybe = responses.some(r => r.status === 'maybe');

    if (hasYes) return 'yes';
    if (hasMaybe) return 'maybe';
    if (hasNo && !hasYes && !hasMaybe) return 'no';

    return 'pending';
}

/**
 * Copy RSVP link to clipboard
 */
export async function copyRsvpLink(rsvpToken: string): Promise<boolean> {
    const url = getGuestRsvpUrl(rsvpToken);
    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch (error) {
        console.error('Failed to copy RSVP link:', error);
        return false;
    }
}

/**
 * Bulk send RSVP invitations (placeholder for email integration)
 */
export async function sendRsvpInvitations(
    guestIds: string[]
): Promise<{ sent: number; failed: number }> {
    // This would integrate with an email service like Resend, SendGrid, etc.
    // For now, just return a mock response
    console.log('Would send RSVP invitations to:', guestIds);
    return { sent: guestIds.length, failed: 0 };
}
