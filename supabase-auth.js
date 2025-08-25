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
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
            throw error;
        }
        // Redirect to login page after successful logout
        window.location.href = "login-supabase.html";
    } catch (error) {
        console.error("Logout failed:", error);
        // Still redirect even if there's an error
        window.location.href = "login-supabase.html";
    }
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

// Get posts by a specific user ID (for viewing other users' galleries)
export async function getUserPostsById(
    targetUserId,
    currentUserId = null,
    limit = 20
) {
    try {
        // Get posts with like counts
        const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (postsError) throw postsError;

        // Check which posts the current user has liked (if currentUserId is provided)
        const postsWithLikes = await Promise.all(
            posts.map(async (post) => {
                let userLiked = false;
                if (currentUserId) {
                    userLiked = await checkUserLike(post.id, currentUserId);
                }
                return {
                    ...post,
                    user_liked: userLiked,
                };
            })
        );

        return postsWithLikes;
    } catch (error) {
        console.error("Error getting user posts by ID:", error);
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

            // Decrease like count - first get current likes
            const { data: currentPost, error: fetchError } = await supabase
                .from("posts")
                .select("likes")
                .eq("id", postId)
                .single();

            if (fetchError) throw fetchError;

            const newLikeCount = Math.max((currentPost.likes || 0) - 1, 0);
            const { error: updateError } = await supabase
                .from("posts")
                .update({ likes: newLikeCount })
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

            // Increase like count - first get current likes
            const { data: currentPost, error: fetchError } = await supabase
                .from("posts")
                .select("likes")
                .eq("id", postId)
                .single();

            if (fetchError) throw fetchError;

            const newLikeCount = (currentPost.likes || 0) + 1;
            const { error: updateError } = await supabase
                .from("posts")
                .update({ likes: newLikeCount })
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

// --- Job Request System Functions ---

// Create a new job request
export async function createJobRequest(userId, jobData) {
    try {
        const { data, error } = await supabase
            .from("job_requests")
            .insert({
                client_id: userId,
                title: jobData.title,
                description: jobData.description,
                budget_min: jobData.budgetMin,
                budget_max: jobData.budgetMax,
                skills_required: jobData.skillsRequired,
                location: jobData.location,
                deadline: jobData.deadline,
                status: "open",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error creating job request:", error);
        throw error;
    }
}

// Get all job requests (for apprentices to browse)
export async function getAllJobRequests(filters = {}) {
    try {
        let query = supabase
            .from("job_requests")
            .select(
                `
                *,
                client:profiles!job_requests_client_id_fkey(
                    id,
                    name,
                    email,
                    creative_type,
                    location
                )
            `
            )
            .eq("status", "open")
            .order("created_at", { ascending: false });

        // Apply filters
        if (filters.skillsRequired) {
            query = query.contains("skills_required", [filters.skillsRequired]);
        }
        if (filters.location) {
            query = query.ilike("location", `%${filters.location}%`);
        }
        if (filters.budgetMin) {
            query = query.gte("budget_max", filters.budgetMin);
        }
        if (filters.budgetMax) {
            query = query.lte("budget_min", filters.budgetMax);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching job requests:", error);
        throw error;
    }
}

// Get job requests created by a specific client
export async function getClientJobRequests(clientId) {
    try {
        const { data, error } = await supabase
            .from("job_requests")
            .select(
                `
                *,
                applications:job_applications(
                    id,
                    status,
                    created_at,
                    apprentice:profiles!job_applications_apprentice_id_fkey(
                        id,
                        name,
                        skill,
                        location
                    )
                )
            `
            )
            .eq("client_id", clientId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching client job requests:", error);
        throw error;
    }
}

// Get job applications for an apprentice
export async function getApprenticeJobApplications(apprenticeId) {
    try {
        const { data, error } = await supabase
            .from("job_applications")
            .select(
                `
                *,
                job_request:job_requests(
                    id,
                    title,
                    description,
                    budget_min,
                    budget_max,
                    deadline,
                    status,
                    client:profiles!job_requests_client_id_fkey(
                        id,
                        name,
                        email,
                        creative_type
                    )
                )
            `
            )
            .eq("apprentice_id", apprenticeId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching apprentice applications:", error);
        throw error;
    }
}

// Apply for a job
export async function applyForJob(apprenticeId, jobRequestId, proposal) {
    try {
        // Check if already applied
        const { data: existingApplication } = await supabase
            .from("job_applications")
            .select("id")
            .eq("apprentice_id", apprenticeId)
            .eq("job_request_id", jobRequestId)
            .single();

        if (existingApplication) {
            throw new Error("You have already applied for this job");
        }

        const { data, error } = await supabase
            .from("job_applications")
            .insert({
                apprentice_id: apprenticeId,
                job_request_id: jobRequestId,
                proposal: proposal,
                status: "pending",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error applying for job:", error);
        throw error;
    }
}

// Accept or reject a job application
export async function updateApplicationStatus(applicationId, status, clientId) {
    try {
        // Verify the client owns the job request
        const { data: application, error: fetchError } = await supabase
            .from("job_applications")
            .select(
                `
                *,
                job_request:job_requests!inner(client_id)
            `
            )
            .eq("id", applicationId)
            .eq("job_request.client_id", clientId)
            .single();

        if (fetchError || !application) {
            throw new Error("Application not found or unauthorized");
        }

        const { data, error } = await supabase
            .from("job_applications")
            .update({
                status: status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId)
            .select()
            .single();

        if (error) throw error;

        // If accepted, update job request status to "in_progress"
        if (status === "accepted") {
            await supabase
                .from("job_requests")
                .update({
                    status: "in_progress",
                    assigned_apprentice_id: application.apprentice_id,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", application.job_request_id);
        }

        return data;
    } catch (error) {
        console.error("Error updating application status:", error);
        throw error;
    }
}

// Update job progress
export async function updateJobProgress(jobRequestId, progress, apprenticeId) {
    try {
        // Verify the apprentice is assigned to this job
        const { data: job, error: fetchError } = await supabase
            .from("job_requests")
            .select("assigned_apprentice_id")
            .eq("id", jobRequestId)
            .eq("assigned_apprentice_id", apprenticeId)
            .single();

        if (fetchError || !job) {
            throw new Error("Job not found or unauthorized");
        }

        const { data, error } = await supabase
            .from("job_requests")
            .update({
                progress: progress,
                updated_at: new Date().toISOString(),
            })
            .eq("id", jobRequestId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error updating job progress:", error);
        throw error;
    }
}

// Complete a job
export async function completeJob(jobRequestId, apprenticeId) {
    try {
        // Verify the apprentice is assigned to this job
        const { data: job, error: fetchError } = await supabase
            .from("job_requests")
            .select("assigned_apprentice_id, budget_min, budget_max")
            .eq("id", jobRequestId)
            .eq("assigned_apprentice_id", apprenticeId)
            .single();

        if (fetchError || !job) {
            throw new Error("Job not found or unauthorized");
        }

        const { data, error } = await supabase
            .from("job_requests")
            .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", jobRequestId)
            .select()
            .single();

        if (error) throw error;

        // Calculate payment (average of min and max budget)
        const payment = Math.round((job.budget_min + job.budget_max) / 2);

        // Add earnings to apprentice profile - first get current values
        const { data: currentProfile, error: profileError } = await supabase
            .from("profiles")
            .select("total_earnings, completed_jobs")
            .eq("id", apprenticeId)
            .single();

        if (profileError) throw profileError;

        const newTotalEarnings = (currentProfile.total_earnings || 0) + payment;
        const newCompletedJobs = (currentProfile.completed_jobs || 0) + 1;

        await supabase
            .from("profiles")
            .update({
                total_earnings: newTotalEarnings,
                completed_jobs: newCompletedJobs,
                updated_at: new Date().toISOString(),
            })
            .eq("id", apprenticeId);

        return { ...data, payment };
    } catch (error) {
        console.error("Error completing job:", error);
        throw error;
    }
}

// Get apprentice statistics
export async function getApprenticeStats(apprenticeId) {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select(
                `
                total_earnings,
                completed_jobs,
                pending_jobs:job_applications(count),
                active_jobs:job_requests(count)
            `
            )
            .eq("id", apprenticeId)
            .single();

        if (error) throw error;

        // Get pending applications count
        const { count: pendingApplications } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("apprentice_id", apprenticeId)
            .eq("status", "pending");

        // Get active jobs count
        const { count: activeJobs } = await supabase
            .from("job_requests")
            .select("*", { count: "exact", head: true })
            .eq("assigned_apprentice_id", apprenticeId)
            .eq("status", "in_progress");

        return {
            totalEarned: data.total_earnings || 0,
            completedJobs: data.completed_jobs || 0,
            pendingJobs: pendingApplications || 0,
            activeJobs: activeJobs || 0,
        };
    } catch (error) {
        console.error("Error fetching apprentice stats:", error);
        throw error;
    }
}

// Get client statistics
export async function getClientStats(clientId) {
    try {
        const { data, error } = await supabase
            .from("job_requests")
            .select("*")
            .eq("client_id", clientId);

        if (error) throw error;

        const stats = {
            totalJobs: data.length,
            openJobs: data.filter((job) => job.status === "open").length,
            inProgressJobs: data.filter((job) => job.status === "in_progress")
                .length,
            completedJobs: data.filter((job) => job.status === "completed")
                .length,
            totalSpent: data
                .filter((job) => job.status === "completed")
                .reduce(
                    (sum, job) =>
                        sum + Math.round((job.budget_min + job.budget_max) / 2),
                    0
                ),
        };

        return stats;
    } catch (error) {
        console.error("Error fetching client stats:", error);
        throw error;
    }
}
