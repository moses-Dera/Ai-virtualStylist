import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { AppUser, UserProfile } from '../types';

// --- Helper Functions ---

// Converts a base64 string to a File object so it can be uploaded to Storage
const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    // The first part of the array is the mime type
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) {
        throw new Error("Invalid base64 string for mime type.");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}


// --- Authentication ---

export const signUp = async (email: string, password: string): Promise<{error: AuthError | null}> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
};

export const login = async (email: string, password: string): Promise<{error: AuthError | null}> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
};

export const signInWithGoogleOAuth = async (): Promise<{error: AuthError | null}> => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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
    const { userImage, ...restOfProfileData } = profileData as UserProfile & { userImage?: string };
    const dbData: Partial<AppUser> = { ...restOfProfileData };

    // If userImage is a new base64 string, upload it to storage first
    if (userImage && userImage.startsWith('data:image')) {
        try {
            const file = base64ToFile(userImage, `avatar-${userId}.png`);
            // Use a consistent file path to allow for easy updates/overwrites
            const filePath = `public/${userId}/avatar.png`;

            const { error: uploadError } = await supabase.storage
                .from('user_images') // Assumes a public bucket named 'user_images' exists
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true, // This will overwrite the existing file, which is desired for a profile picture
                });

            if (uploadError) throw uploadError;

            // Get the public URL of the uploaded file
            const { data: urlData } = supabase.storage
                .from('user_images')
                .getPublicUrl(filePath);

            dbData.user_image_url = urlData.publicUrl;

        } catch (storageError) {
            console.error('Error uploading new profile image:', storageError);
            throw new Error("Failed to upload the new profile image. Please try again.");
        }
    } else if (userImage !== undefined) {
       // This handles cases where the image is cleared (set to null) or is already a URL
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