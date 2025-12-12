
import { supabase } from './supabaseClient';
import { UserProfile, Message, Conversation } from '../types';

// --- AUTHENTICATION ---

export const signUpUser = async (email: string, password: string, name: string): Promise<{ user: UserProfile | null, error: string | null }> => {
    if (supabase) {
        // Supabase Implementation
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // This sends the name to Supabase user_metadata
                data: { name }
            }
        });
        
        if (error) {
             console.warn("Supabase auth failed, falling back to local:", error.message);
             return { user: null, error: error.message };
        } else if (data.user) {
            return {
                user: {
                    name: data.user.user_metadata.name || name,
                    email: data.user.email || email,
                    joinedDate: new Date(data.user.created_at)
                },
                error: null
            };
        }
    } 
    
    // Local Storage Fallback
    try {
        const existing = localStorage.getItem(`zestislam_user_${email}`);
        if (existing) return { user: null, error: "User already exists locally." };

        const newUser: UserProfile = {
            name,
            email,
            joinedDate: new Date()
        };
        localStorage.setItem(`zestislam_user_${email}`, JSON.stringify(newUser));
        return { user: newUser, error: null };
    } catch (e) {
        return { user: null, error: "Local storage error" };
    }
};

export const signInUser = async (email: string, password: string): Promise<{ user: UserProfile | null, error: string | null }> => {
    if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.warn("Supabase signin failed:", error.message);
             // Don't fallback to local on wrong password
             if (error.message.includes("Invalid login")) {
                 return { user: null, error: "Invalid email or password" };
             }
        } else if (data.user) {
            return {
                user: {
                    name: data.user.user_metadata.name || email.split('@')[0],
                    email: data.user.email || email,
                    joinedDate: new Date(data.user.created_at)
                },
                error: null
            };
        }
    }

    try {
        const stored = localStorage.getItem(`zestislam_user_${email}`);
        if (stored) {
            const user = JSON.parse(stored);
            return { user, error: null };
        }
        return { user: null, error: "User not found or invalid credentials." };
    } catch (e) {
        return { user: null, error: "Login failed" };
    }
};

export const resetUserPassword = async (email: string): Promise<{ success: boolean, error: string | null }> => {
    if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, 
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true, error: null };
    }
    return { success: true, error: null };
}

export const updateUserPassword = async (password: string) => {
    if (supabase) {
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, error: null };
    }
    return { success: false, error: "Service unavailable" };
};

export const subscribeToAuthChanges = (callback: (event: string, session: any) => void) => {
    if (supabase) {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
        return data.subscription;
    }
    return null;
}

export const signOutUser = async () => {
    if (supabase) {
        await supabase.auth.signOut();
    }
};

// --- CONVERSATION MANAGEMENT ---

export const getUserConversations = async (email: string): Promise<Conversation[]> => {
    if (supabase) {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_email', email)
            .order('updated_at', { ascending: false });
        
        if (!error && data) {
            return data.map((d: any) => ({
                id: d.id,
                title: d.title,
                lastMessage: d.last_message || 'No messages',
                timestamp: new Date(d.created_at)
            }));
        }
    }

    const stored = localStorage.getItem(`zestislam_conversations_${email}`);
    if (stored) {
        return JSON.parse(stored).map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp)
        }));
    }
    return [];
}

export const createConversation = async (email: string, title: string, id?: string): Promise<Conversation> => {
    const newConv: Conversation = {
        id: id || crypto.randomUUID(),
        title,
        lastMessage: '',
        timestamp: new Date()
    };

    if (supabase) {
        const { data, error } = await supabase.from('conversations').insert({
            id: newConv.id,
            user_email: email,
            title: title,
            created_at: newConv.timestamp.toISOString(),
            updated_at: newConv.timestamp.toISOString()
        }).select();

        if (!error && data) {
            return newConv;
        }
    }

    const existing = await getUserConversations(email);
    const updated = [newConv, ...existing.filter(c => c.id !== newConv.id)];
    localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(updated));
    return newConv;
}

export const updateConversationTitle = async (email: string, conversationId: string, newTitle: string) => {
    if (supabase) {
        await supabase.from('conversations').update({ title: newTitle }).eq('id', conversationId);
    }
    
    const existing = await getUserConversations(email);
    const updated = existing.map(c => c.id === conversationId ? { ...c, title: newTitle } : c);
    localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(updated));
}

export const deleteConversation = async (email: string, conversationId: string) => {
    if (supabase) {
        await supabase.from('conversations').delete().eq('id', conversationId);
        await supabase.from('messages').delete().eq('conversation_id', conversationId);
    }

    const existing = await getUserConversations(email);
    const updated = existing.filter(c => c.id !== conversationId);
    localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(updated));
    localStorage.removeItem(`zestislam_messages_${conversationId}`);
}

// --- MESSAGE MANAGEMENT ---

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
    if (supabase) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        
        if (!error && data) {
            return data.map((d: any) => ({
                id: d.id,
                role: d.role,
                content: d.content,
                timestamp: new Date(d.created_at),
                conversationId: d.conversation_id
            }));
        }
    }

    const stored = localStorage.getItem(`zestislam_messages_${conversationId}`);
    if (stored) {
        return JSON.parse(stored).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
        }));
    }
    return [];
};

export const saveUserChatMessage = async (email: string, conversationId: string, message: Message, isNewConversation = false, title = '') => {
    if (isNewConversation) {
        await createConversation(email, title, conversationId);
    }

    if (supabase) {
        await supabase.from('messages').insert({
            conversation_id: conversationId,
            user_email: email,
            role: message.role,
            content: message.content,
            created_at: message.timestamp.toISOString(),
            id: message.id 
        });
        
        await supabase.from('conversations').update({
            last_message: message.content.substring(0, 50),
            updated_at: new Date().toISOString()
        }).eq('id', conversationId);
    }

    const history = await getConversationMessages(conversationId);
    const updatedMsgs = [...history, message];
    localStorage.setItem(`zestislam_messages_${conversationId}`, JSON.stringify(updatedMsgs));

    const conversations = await getUserConversations(email);
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (convIndex >= 0) {
        conversations[convIndex].lastMessage = message.content.substring(0, 50) + '...';
        conversations[convIndex].timestamp = new Date();
        const active = conversations.splice(convIndex, 1)[0];
        conversations.unshift(active);
        localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify(conversations));
    } else if (isNewConversation) {
        const newConv: Conversation = {
            id: conversationId,
            title: title || 'New Chat',
            lastMessage: message.content.substring(0, 50),
            timestamp: new Date()
        };
        
        if(!conversations.find(c => c.id === conversationId)) {
             localStorage.setItem(`zestislam_conversations_${email}`, JSON.stringify([newConv, ...conversations]));
        }
    }
};

// --- CONTACT FORM ---

export const sendContactMessage = async (name: string, email: string, message: string): Promise<{ success: boolean, error?: string }> => {
    // 1. Try to save to Supabase 'contact_messages' table
    if (supabase) {
        try {
            const { error } = await supabase.from('contact_messages').insert({
                name,
                email,
                message,
                created_at: new Date().toISOString()
            });
            
            if (error) {
                // Log the actual error message clearly so we know why it failed (e.g. table missing)
                // Returning success: false triggers the mailto fallback in App.tsx
                console.warn("Supabase Contact Error (Switching to Mailto):", error.message || JSON.stringify(error));
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (e: any) {
            console.error("Supabase Unexpected Error:", e);
            return { success: false, error: e.message || "Unknown error" };
        }
    }
    
    // If Supabase is not connected, return false to trigger mailto fallback
    return { success: false, error: "Database not connected" };
}