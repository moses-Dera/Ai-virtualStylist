import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { AppUser, UserProfile } from '../types';

// --- Authentication ---

export const signUp = async (email: string, password: string): Promise<{error: AuthError | null}> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
};

export const login = async (email: string, password: string): Promise<{error: AuthError | null}> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
};

export const loginWithGoogle = async (): Promise<{error: AuthError | null}> => {
    const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        }
    });
    return { error };
};

export const logout = async () => {
    await supabase.auth.signOut();
};


// --- User Profile and Data ---

const defaultProfile = {
    height: 175,
    weight: 70,
    chest: 98,
    waist: 82,
    hips: 96,
    user_image_url: null,
    closet: [],
};

// Fetches a user's profile from the 'profiles' table
export const getUserProfile = async (user: SupabaseUser): Promise<AppUser> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: row not found
        console.error('Error fetching profile:', error);
        throw error;
    }

    if (data) {
        return {
            id: user.id,
            email: user.email,
            ...data,
        };
    } else {
        // No profile found, create one
        const newUserProfile: AppUser = {
            id: user.id,
            email: user.email,
            name: user.user_metadata.full_name || user.email?.split('@')[0],
            ...defaultProfile,
            user_image_url: user.user_metadata.avatar_url || null,
        };
        // Save the newly created profile back to the DB
        await updateUserProfile(user.id, {
            name: newUserProfile.name,
            height: newUserProfile.height,
            weight: newUserProfile.weight,
            chest: newUserProfile.chest,
            waist: newUserProfile.waist,
            hips: newUserProfile.hips,
            user_image_url: newUserProfile.user_image_url,
            closet: newUserProfile.closet
        });
        return newUserProfile;
    }
};

// Updates a user's profile in the 'profiles' table
export const updateUserProfile = async (
    userId: string, 
    profileData: Partial<AppUser>
): Promise<AppUser> => {
    // Separate userImage from UserProfile to user_image_url for DB
    const { userImage, ...restOfProfileData } = profileData as UserProfile & { userImage?: string };
    const dbData: Partial<AppUser> = { ...restOfProfileData };
    if (userImage !== undefined) {
        dbData.user_image_url = userImage;
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...dbData })
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
    
    // Fetch the current auth user to merge with profile data
    const { data: { user } } = await supabase.auth.getUser();
    
    return {
        id: user!.id,
        email: user!.email,
        ...data,
    };
};