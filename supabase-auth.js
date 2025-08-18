// supabase-auth.js - Fixed version
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.39.3";

// Your Supabase project configuration
const supabaseUrl = "https://xmffdlciwrvuycnsgezb.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZmZkbGNpd3J2dXljbnNnZXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjUzMzQsImV4cCI6MjA3MDYwMTMzNH0.bBPsRDAljy2WDkw9K6faOFDYrJ7F8EJT5F4cqdI4MQQ";

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Error Handling ---
export function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("hidden-view", "hidden");
    }
}

// --- Authentication Functions ---
export async function handleLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        window.location.href = "dashboard-supabase.html";
    } catch (error) {
        showError("login-error", "Invalid email or password.");
    }
}

export async function handleMemberSignup(name, email, password, creativeType) {
    try {
        // Step 1: Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp(
            {
                email,
                password,
                options: {
                    data: {
                        name: name,
                        role: "member",
                        creative_type: creativeType,
                    },
                },
            }
        );

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error("User creation failed");
        }

        // Step 2: Use upsert to handle potential existing profile
        const { error: profileError } = await supabase.from("profiles").upsert(
            {
                id: authData.user.id,
                name: name,
                email: email,
                role: "member",
                creative_type: creativeType,
                eligibility_points: 0,
                referral_points: 0,
                referrals: 0,
                followers: 0,
                following: 0,
                subscription_plan: "free",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "id",
            }
        );

        if (profileError) {
            console.warn("Profile creation warning:", profileError);
            // Don't throw error here, profile might already exist
        }

        // Always redirect to dashboard on successful auth
        window.location.href = "dashboard-supabase.html";
    } catch (error) {
        console.error("Member signup error:", error);
        showError("signup-member-error", "Signup failed: " + error.message);
    }
}

export async function handleApprenticeSignup(
    name,
    skill,
    location,
    email,
    password
) {
    try {
        // Step 1: Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp(
            {
                email,
                password,
                options: {
                    data: {
                        name: name,
                        role: "apprentice",
                        skill: skill,
                        location: location,
                    },
                },
            }
        );

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error("User creation failed");
        }

        // Step 2: Use upsert to handle potential existing profile
        const { error: profileError } = await supabase.from("profiles").upsert(
            {
                id: authData.user.id,
                name: name,
                email: email,
                role: "apprentice",
                skill: skill,
                location: location,
                followers: 0,
                following: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "id",
            }
        );

        if (profileError) {
            console.warn("Profile creation warning:", profileError);
            // Don't throw error here, profile might already exist
        }

        // Always redirect to dashboard on successful auth
        window.location.href = "dashboard-supabase.html";
    } catch (error) {
        console.error("Apprentice signup error:", error);
        showError("signup-apprentice-error", "Signup failed: " + error.message);
    }
}

export async function handleLogout() {
    await supabase.auth.signOut();
}

// --- Helper Functions for Database Operations ---

// Get current user profile with retry logic
export async function getUserProfile(userId) {
    let retries = 3;
    let lastError;

    while (retries > 0) {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error && error.code === "PGRST116") {
                // Profile not found, create it with basic info
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user) {
                    const userMetadata = userData.user.user_metadata || {};
                    await createBasicProfile(userId, userMetadata);
                    // Retry fetching after creating
                    retries--;
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                }
            }

            if (error) throw error;
            return data;
        } catch (error) {
            lastError = error;
            retries--;
            if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    }

    throw lastError;
}

// Create basic profile if it doesn't exist
async function createBasicProfile(userId, metadata) {
    const profileData = {
        id: userId,
        name: metadata.name || "New User",
        email: metadata.email || "",
        role: metadata.role || "member",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (metadata.role === "member") {
        profileData.creative_type = metadata.creative_type || "Other";
        profileData.eligibility_points = 0;
        profileData.referral_points = 0;
        profileData.referrals = 0;
        profileData.subscription_plan = "free";
    } else if (metadata.role === "apprentice") {
        profileData.skill = metadata.skill || "Not specified";
        profileData.location = metadata.location || "Not specified";
    }

    profileData.followers = 0;
    profileData.following = 0;

    const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" });

    if (error) {
        console.warn("Failed to create basic profile:", error);
    }
}

// Update user profile
export async function updateUserProfile(userId, updates) {
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

    if (error) throw error;
    return data;
}

// Increment points
export async function incrementUserPoints(userId, pointType, amount) {
    const { data: currentData, error: fetchError } = await supabase
        .from("profiles")
        .select(pointType)
        .eq("id", userId)
        .single();

    if (fetchError) throw fetchError;

    const newValue = (currentData[pointType] || 0) + amount;

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            [pointType]: newValue,
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (updateError) throw updateError;
}

// Add a post
export async function addPost(userId, title, description, imageUrl) {
    const { data, error } = await supabase.from("posts").insert({
        user_id: userId,
        title: title,
        description: description,
        image_url: imageUrl,
        likes: 0,
        created_at: new Date().toISOString(),
    });

    if (error) throw error;
    return data;
}

// Get user posts
export async function getUserPosts(userId, limit = 20) {
    try {
        // Get posts with like counts
        const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (postsError) throw postsError;

        // Check which posts the current user has liked
        const postsWithLikes = await Promise.all(
            posts.map(async (post) => {
                const userLiked = await checkUserLike(post.id, userId);
                return {
                    ...post,
                    user_liked: userLiked,
                };
            })
        );

        return postsWithLikes;
    } catch (error) {
        console.error("Error getting user posts:", error);
        throw error;
    }
}

// Delete a post
export async function deletePost(postId, userId) {
    try {
        // First get the post to check ownership and get image URL
        const { data: post, error: fetchError } = await supabase
            .from("posts")
            .select("image_url, user_id")
            .eq("id", postId)
            .single();

        if (fetchError) throw fetchError;

        // Check if user owns the post
        if (post.user_id !== userId) {
            throw new Error("You can only delete your own posts");
        }

        // Delete the post from database
        const { error: deleteError } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId)
            .eq("user_id", userId);

        if (deleteError) throw deleteError;

        // Try to delete the image file from storage (optional - won't fail if file doesn't exist)
        if (post.image_url) {
            try {
                const imagePath = post.image_url.split("/").slice(-2).join("/"); // Extract path from URL
                await supabase.storage.from("posts").remove([imagePath]);
            } catch (storageError) {
                console.warn("Could not delete image file:", storageError);
                // Don't fail the whole operation if storage deletion fails
            }
        }

        return true;
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}

// Like/Unlike a post
export async function togglePostLike(postId, userId) {
    try {
        // Check if user already liked this post
        const { data: existingLike, error: checkError } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", postId)
            .eq("user_id", userId)
            .single();

        if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
        }

        if (existingLike) {
            // Unlike: remove the like
            const { error: unlikeError } = await supabase
                .from("post_likes")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", userId);

            if (unlikeError) throw unlikeError;

            // Decrease like count
            const { error: updateError } = await supabase
                .from("posts")
                .update({ likes: supabase.sql`GREATEST(likes - 1, 0)` })
                .eq("id", postId);

            if (updateError) throw updateError;

            return { liked: false, action: "unliked" };
        } else {
            // Like: add the like
            const { error: likeError } = await supabase
                .from("post_likes")
                .insert({
                    post_id: postId,
                    user_id: userId,
                    created_at: new Date().toISOString(),
                });

            if (likeError) throw likeError;

            // Increase like count
            const { error: updateError } = await supabase
                .from("posts")
                .update({ likes: supabase.sql`likes + 1` })
                .eq("id", postId);

            if (updateError) throw updateError;

            return { liked: true, action: "liked" };
        }
    } catch (error) {
        console.error("Error toggling post like:", error);
        throw error;
    }
}

// Check if user has liked a post
export async function checkUserLike(postId, userId) {
    try {
        const { data, error } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", postId)
            .eq("user_id", userId)
            .single();

        if (error && error.code === "PGRST116") {
            return false; // No like found
        }

        if (error) throw error;
        return true; // Like found
    } catch (error) {
        console.error("Error checking user like:", error);
        return false;
    }
}

// Get users by role
export async function getUsersByRole(role, limit = 50) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", role)
        .limit(limit);

    if (error) throw error;
    return data;
}

// Search users
export async function searchUsers(
    searchTerm,
    creativeTypeFilter = "",
    role = "member",
    limit = 50
) {
    let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", role)
        .limit(limit);

    if (creativeTypeFilter && creativeTypeFilter.trim() !== "") {
        if (role === "member") {
            query = query.eq("creative_type", creativeTypeFilter);
        } else {
            query = query.ilike("skill", `%${creativeTypeFilter}%`);
        }
    }

    if (searchTerm && searchTerm.trim() !== "") {
        const term = searchTerm.trim();
        query = query.or(
            `name.ilike.%${term}%,email.ilike.%${term}%,creative_type.ilike.%${term}%,skill.ilike.%${term}%,location.ilike.%${term}%`
        );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

// Get top users by points
export async function getTopUsers(limit = 10) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "member")
        .order("referral_points", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

// Get trending creators
export async function getTrendingCreators(role = "member", limit = 10) {
    const targetRole = role === "member" ? "apprentice" : "member";

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", targetRole)
        .order("followers", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

// Follow a user
export async function followUser(followerId, followingId) {
    try {
        // Check if already following
        const { data: existingFollow, error: checkError } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", followerId)
            .eq("following_id", followingId)
            .single();

        if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
        }

        if (existingFollow) {
            return true; // Already following
        }

        // Create follow relationship
        const { error: followError } = await supabase.from("follows").insert({
            follower_id: followerId,
            following_id: followingId,
            created_at: new Date().toISOString(),
        });

        if (followError) throw followError;

        // Update follower counts using RPC functions
        const { error: incrementError } = await supabase.rpc(
            "increment_followers",
            { user_id: followingId }
        );

        if (incrementError) throw incrementError;

        const { error: incrementFollowingError } = await supabase.rpc(
            "increment_following",
            { user_id: followerId }
        );

        if (incrementFollowingError) throw incrementFollowingError;

        // Award points to follower
        await incrementUserPoints(followerId, "eligibility_points", 25);

        return true;
    } catch (error) {
        console.error("Error following user:", error);
        return false;
    }
}

// Upload file to Supabase Storage
export async function uploadFile(bucket, path, file) {
    try {
        // First, check if the bucket exists
        const { data: buckets, error: listError } =
            await supabase.storage.listBuckets();

        if (listError) {
            console.error("Error listing buckets:", listError);
            throw new Error("Failed to access storage");
        }

        // Check if our bucket exists
        const bucketExists = buckets.some((b) => b.name === bucket);

        if (!bucketExists) {
            console.log(
                `Bucket '${bucket}' doesn't exist, attempting to create it...`
            );

            // Try to create the bucket
            const { error: createError } = await supabase.storage.createBucket(
                bucket,
                {
                    public: true,
                    allowedMimeTypes: ["image/*"],
                    fileSizeLimit: 5242880, // 5MB
                }
            );

            if (createError) {
                console.error("Error creating bucket:", createError);
                throw new Error(
                    `Storage bucket '${bucket}' not accessible. Please contact support.`
                );
            }
        }

        // Upload the file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Upload error:", error);
            throw error;
        }

        console.log("File uploaded successfully:", data);
        return data;
    } catch (error) {
        console.error("Upload file error:", error);
        throw error;
    }
}

// Get public URL for uploaded file
export function getFileUrl(bucket, path) {
    try {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);

        if (!data.publicUrl) {
            throw new Error("Failed to generate public URL");
        }

        console.log("Generated public URL:", data.publicUrl);
        return data.publicUrl;
    } catch (error) {
        console.error("Error getting file URL:", error);
        throw error;
    }
}

// Check if storage bucket exists and is accessible
export async function checkStorageBucket(bucketName) {
    try {
        console.log(`🔍 Checking bucket '${bucketName}'...`);

        // First check if the bucket exists by listing all buckets
        const { data: buckets, error: listError } =
            await supabase.storage.listBuckets();

        if (listError) {
            console.error(`❌ Error listing buckets:`, listError);
            return false;
        }

        console.log(
            `📦 Available buckets:`,
            buckets.map((b) => b.name)
        );

        // Check if our specific bucket exists
        const bucketExists = buckets.some((b) => b.name === bucketName);

        if (!bucketExists) {
            console.log(
                `❌ Bucket '${bucketName}' does not exist in available buckets`
            );
            return false;
        }

        console.log(`✅ Bucket '${bucketName}' exists in bucket list`);

        // Now test if we can access the bucket by trying to list files
        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list("", { limit: 1 });

            if (error) {
                console.error(
                    `❌ Bucket '${bucketName}' access failed:`,
                    error
                );
                return false;
            }

            console.log(
                `✅ Bucket '${bucketName}' is accessible and can list files`
            );
            return true;
        } catch (accessError) {
            console.error(
                `❌ Error accessing bucket '${bucketName}':`,
                accessError
            );
            return false;
        }
    } catch (error) {
        console.error(
            `❌ Unexpected error checking bucket '${bucketName}':`,
            error
        );
        return false;
    }
}
