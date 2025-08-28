// dashboard-supabase.js - Fixed version
import {
    supabase,
    handleLogout,
    getUserProfile,
    updateUserProfile,
    incrementUserPoints,
    addPost,
    getUserPosts,
    deletePost,
    togglePostLike,
    checkUserLike,
    getUsersByRole,
    searchUsers,
    getTopUsers,
    getTrendingCreators,
    followUser,
    getFileUrl,
    checkStorageBucket,
    createJobRequest,
    getAllJobRequests,
    getClientJobRequests,
    getApprenticeJobApplications,
    applyForJob,
    updateApplicationStatus,
    updateJobProgress,
    completeJob,
    getApprenticeStats,
    getClientStats,
    getUserPostsById,
    generateReferralCode,
    getUserReferralCode,
    getUserReferralStats,
} from "./supabase-auth.js";

// --- DOM Elements ---
const loadingScreen = document.getElementById("loading-screen");
const dashboardLayout = document.getElementById("dashboard-layout");
const mainContent = document.getElementById("main-content");
const userNameEl = document.getElementById("user-name");
const userRoleInfoEl = document.getElementById("user-role-info");
const userAvatarEl = document.getElementById("user-avatar");
const logoutButton = document.getElementById("logout-button");
const mainNav = document.getElementById("main-nav");

// Modal Elements
const uploadModal = document.getElementById("upload-modal");
const paymentModal = document.getElementById("payment-modal");
const editProfileModal = document.getElementById("edit-profile-modal");
const editProfileForm = document.getElementById("edit-profile-form");
const uploadWorkForm = document.getElementById("upload-work-form");
const deletePostModal = document.getElementById("delete-post-modal");

// --- Configurations ---
const subscriptionPlans = {
    free: {
        name: "Free",
        price: 0,
        unlocks: [
            "home",
            "gallery",
            "refer",
            "followers",
            "profile",
            "explore",
        ],
    },
    creative: {
        name: "Creative",
        price: 4500,
        unlocks: [
            "home",
            "gallery",
            "refer",
            "followers",
            "subscription",
            "earnings",
            "profile",
            "explore",
        ],
    },
    entrepreneur: {
        name: "Entrepreneur",
        price: 12000,
        unlocks: [
            "home",
            "gallery",
            "refer",
            "followers",
            "subscription",
            "earnings",
            "leaderboard",
            "find_apprentices",
            "profile",
            "explore",
        ],
    },
    visionary: { name: "Visionary", price: 37500, unlocks: ["*"] },
};

// --- TABS CONFIGURATION ---
const memberTabs = [
    { id: "home", name: "Home", icon: "home", access: "free" },
    { id: "explore", name: "Explore", icon: "compass", access: "free" },
    { id: "gallery", name: "Gallery", icon: "image", access: "free" },
    { id: "jobs", name: "Jobs", icon: "briefcase", access: "free" },
    {
        id: "subscription",
        name: "Subscription",
        icon: "shield",
        access: "free",
    },
    { id: "earnings", name: "Earn Points", icon: "award", access: "free" },
    {
        id: "leaderboard",
        name: "Leaderboard",
        icon: "bar-chart-2",
        access: "locked",
    },
    { id: "profile", name: "Profile", icon: "user", access: "free" },
];

const apprenticeTabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "gallery", name: "Gallery", icon: "image" },
    { id: "jobs", name: "Jobs & Requests", icon: "briefcase" },
    { id: "earnings", name: "Earnings & Progress", icon: "dollar-sign" },
    { id: "extras", name: "Extras", icon: "gift" },
    { id: "settings", name: "Settings & Info", icon: "settings" },
];

let currentActiveTab = "home";

// --- DYNAMIC CONTENT TEMPLATES ---

// --- Apprentice Templates ---
const apprenticeContentTemplates = {
    home: async (userData) => {
        // Get real apprentice stats
        let stats = {
            pendingJobs: 0,
            activeJobs: 0,
            completedJobs: 0,
            totalEarned: 0,
        };

        try {
            stats = await getApprenticeStats(userData.id);
        } catch (error) {
            console.error("Error fetching apprentice stats:", error);
        }

        return `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome, ${
                userData.name || "Apprentice"
            }!</h1>
            <p class="text-gray-600">Here's your overview.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
             <!-- Profile Info -->
            <div class="md:col-span-1 bg-white p-6 rounded-lg shadow">
                <div class="flex flex-col items-center text-center">
                    <img id="user-avatar-main" class="w-24 h-24 rounded-full object-cover mb-4" src="https://placehold.co/100x100/EBF4FF/3B82F6?text=${(
                        userData.name || "A"
                    ).charAt(0)}" alt="User profile photo">
                    <h2 class="text-xl font-bold">${
                        userData.name || "Apprentice Name"
                    }</h2>
                    <p class="text-gray-600">${
                        userData.skill || "Skill Not Set"
                    }</p>
                    <p class="text-sm text-gray-500 mt-1"><i data-feather="map-pin" class="inline-block w-4 h-4 mr-1"></i>${
                        userData.location || "Location Not Set"
                    }</p>
                </div>
            </div>
            <!-- Job Stats & Quick Actions -->
            <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                    <h3 class="text-sm font-medium text-gray-500">Pending Jobs</h3>
                    <p class="text-3xl font-bold mt-2">${stats.pendingJobs}</p>
                </div>
                <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                     <h3 class="text-sm font-medium text-gray-500">Active Jobs</h3>
                    <p class="text-3xl font-bold mt-2">${stats.activeJobs}</p>
                </div>
                <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                     <h3 class="text-sm font-medium text-gray-500">Completed Jobs</h3>
                    <p class="text-3xl font-bold mt-2">${
                        stats.completedJobs
                    }</p>
                </div>
                <div class="sm:col-span-3 bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-bold mb-4">Quick Actions</h3>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                         <button class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"><i data-feather="edit" class="w-4 h-4 mr-2"></i>Update Portfolio</button>
                         <button class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center"><i data-feather="briefcase" class="w-4 h-4 mr-2"></i>Track Jobs</button>
                         <button class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center"><i data-feather="dollar-sign" class="w-4 h-4 mr-2"></i>Withdraw Earnings</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    },
    jobs: async (userData) => {
        // Get available job requests for apprentices to apply to
        let availableJobs = [];
        let myApplications = [];
        let apprenticeStats = {
            pendingApplications: 0,
            activeJobs: 0,
            completedJobs: 0,
            totalEarned: 0,
        };

        try {
            availableJobs = await getAllJobRequests();
            myApplications = await getApprenticeJobApplications(userData.id);
            apprenticeStats = await getApprenticeStats(userData.id);
        } catch (error) {
            console.error("Error fetching job data:", error);
        }

        return `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Available Jobs</h1>
            <p class="text-gray-600">Browse and apply for jobs that match your skills.</p>
        </div>
        
        <!-- Job Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="briefcase" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Available Jobs</h3>
                <p class="text-3xl font-bold mt-2 text-blue-600">${
                    availableJobs.length
                }</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="clock" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Pending Applications</h3>
                <p class="text-3xl font-bold mt-2 text-yellow-600">${
                    apprenticeStats.pendingApplications
                }</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="play" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Active Jobs</h3>
                <p class="text-3xl font-bold mt-2 text-green-600">${
                    apprenticeStats.activeJobs
                }</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-purple-100 text-purple-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="dollar-sign" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Total Earned</h3>
                <p class="text-3xl font-bold mt-2 text-purple-600">₦${(
                    apprenticeStats.totalEarned * 1500
                ).toLocaleString()}</p>
            </div>
        </div>

        <!-- Available Jobs -->
        <div class="bg-white rounded-lg shadow mb-8">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-900">Available Jobs</h3>
                <p class="text-gray-600">Browse and apply for jobs that match your skills</p>
            </div>
            <div class="p-6">
                ${
                    availableJobs.length > 0
                        ? `
                    <div class="space-y-6">
                        ${availableJobs
                            .map(
                                (job) => `
                            <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex-1">
                                        <h4 class="text-xl font-semibold text-gray-900">${
                                            job.title
                                        }</h4>
                                        <p class="text-gray-600 mt-1">${
                                            job.description
                                        }</p>
                                        <div class="flex items-center mt-2">
                                            <img src="https://placehold.co/32x32/EBF4FF/3B82F6?text=${
                                                job.client?.name?.charAt(0) ||
                                                "C"
                                            }" 
                                                 alt="${job.client?.name}" 
                                                 class="w-8 h-8 rounded-full mr-2">
                                            <span class="text-sm text-gray-600">${
                                                job.client?.name ||
                                                "Anonymous Client"
                                            }</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                                        <div class="text-2xl font-bold text-green-600">₦${(
                                                            job.budget_min *
                                                            1500
                                                        ).toLocaleString()}-₦${(
                                    job.budget_max * 1500
                                ).toLocaleString()}</div>
                                        <div class="text-sm text-gray-500">Budget</div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">Location:</span>
                                        <span class="font-medium">${
                                            job.location || "Remote"
                                        }</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Deadline:</span>
                                        <span class="font-medium">${new Date(
                                            job.deadline
                                        ).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Skills:</span>
                                        <span class="font-medium">${
                                            job.skills_required?.join(", ") ||
                                            "Any"
                                        }</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Posted:</span>
                                        <span class="font-medium">${new Date(
                                            job.created_at
                                        ).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div class="flex justify-end">
                                    <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium apply-job-btn" 
                                            data-job-id="${job.id}" 
                                            data-job-title="${job.title}">
                                        <i data-feather="send" class="w-4 h-4 mr-2"></i>
                                        Apply Now
                                    </button>
                                </div>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                `
                        : `
                    <div class="text-center py-12">
                        <i data-feather="briefcase" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                        <h4 class="text-xl font-semibold text-gray-700 mb-2">No Available Jobs</h4>
                        <p class="text-gray-500">Check back later for new job opportunities!</p>
                    </div>
                `
                }
            </div>
        </div>

        <!-- My Applications -->
        <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-900">My Applications</h3>
                <p class="text-gray-600">Track your job applications and active work</p>
            </div>
            <div class="p-6">
                ${
                    myApplications.length > 0
                        ? `
                    <div class="space-y-6">
                        ${myApplications
                            .map(
                                (app) => `
                            <div class="border border-gray-200 rounded-lg p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 class="text-xl font-semibold text-gray-900">${
                                            app.job_request.title
                                        }</h4>
                                        <p class="text-gray-600 mt-1">${
                                            app.job_request.description
                                        }</p>
                                        <div class="flex items-center mt-2">
                                            <img src="https://placehold.co/32x32/EBF4FF/3B82F6?text=${
                                                app.job_request.client?.name?.charAt(
                                                    0
                                                ) || "C"
                                            }" 
                                                 alt="${
                                                     app.job_request.client
                                                         ?.name
                                                 }" 
                                                 class="w-8 h-8 rounded-full mr-2">
                                            <span class="text-sm text-gray-600">${
                                                app.job_request.client?.name ||
                                                "Anonymous Client"
                                            }</span>
                                        </div>
                                    </div>
                                    <span class="bg-${
                                        app.status === "pending"
                                            ? "yellow"
                                            : app.status === "accepted"
                                            ? "green"
                                            : "red"
                                    }-100 text-${
                                    app.status === "pending"
                                        ? "yellow"
                                        : app.status === "accepted"
                                        ? "green"
                                        : "red"
                                }-800 text-xs px-3 py-1 rounded-full capitalize">${
                                    app.status
                                }</span>
                                </div>
                                
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">Budget:</span>
                                                                <span class="font-medium">₦${(
                                                                    app
                                                                        .job_request
                                                                        .budget_min *
                                                                    1500
                                                                ).toLocaleString()}-₦${(
                                    app.job_request.budget_max * 1500
                                ).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Deadline:</span>
                                        <span class="font-medium">${new Date(
                                            app.job_request.deadline
                                        ).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Applied:</span>
                                        <span class="font-medium">${new Date(
                                            app.created_at
                                        ).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Job Status:</span>
                                        <span class="font-medium capitalize">${app.job_request.status.replace(
                                            "_",
                                            " "
                                        )}</span>
                                    </div>
                                </div>
                                
                                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h5 class="font-semibold text-gray-900 mb-2">Your Proposal</h5>
                                    <p class="text-gray-600">${app.proposal}</p>
                                </div>
                                
                                ${
                                    app.status === "accepted" &&
                                    app.job_request.status === "in_progress"
                                        ? `
                                    <div class="border-t border-gray-200 pt-4">
                                        <h5 class="font-semibold text-gray-900 mb-3">Job Progress</h5>
                                        <div class="flex items-center space-x-4">
                                            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm update-progress-btn" 
                                                    data-job-id="${app.job_request.id}">
                                                Update Progress
                                            </button>
                                            <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm complete-job-btn" 
                                                    data-job-id="${app.job_request.id}">
                                                Mark Complete
                                            </button>
                                        </div>
                                    </div>
                                `
                                        : ""
                                }
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                `
                        : `
                    <div class="text-center py-12">
                        <i data-feather="send" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                        <h4 class="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h4>
                        <p class="text-gray-500">Apply for jobs above to start earning!</p>
                    </div>
                `
                }
            </div>
        </div>
    `;
    },
    earnings: async (userData) => {
        // Get real earnings data
        let stats = {
            totalEarned: 0,
            availableBalance: 0,
            thisMonth: 0,
            goalProgress: 0,
        };

        try {
            const apprenticeStats = await getApprenticeStats(userData.id);
            stats.totalEarned = apprenticeStats.totalEarned;
            stats.availableBalance = Math.round(stats.totalEarned * 0.8); // 80% available for withdrawal
            stats.thisMonth = Math.round(stats.totalEarned * 0.3); // 30% earned this month
            stats.goalProgress = Math.min(
                100,
                Math.round((stats.totalEarned / 7500000) * 100)
            ); // Goal of ₦7,500,000
        } catch (error) {
            console.error("Error fetching earnings data:", error);
        }

        return `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Earnings & Progress</h1>
            <p class="text-gray-600">Manage your finances and track your growth.</p>
        </div>
        
        <!-- Earnings Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="dollar-sign" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Total Earned</h3>
                <p class="text-3xl font-bold mt-2 text-green-600">₦${(
                    stats.totalEarned * 1500
                ).toLocaleString()}</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="credit-card" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Available Balance</h3>
                <p class="text-3xl font-bold mt-2 text-blue-600">₦${(
                    stats.availableBalance * 1500
                ).toLocaleString()}</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="trending-up" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">This Month</h3>
                <p class="text-3xl font-bold mt-2 text-yellow-600">₦${(
                    stats.thisMonth * 1500
                ).toLocaleString()}</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-purple-100 text-purple-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="target" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Goal Progress</h3>
                <p class="text-3xl font-bold mt-2 text-purple-600">${
                    stats.goalProgress
                }%</p>
            </div>
        </div>

        <!-- Financial Management -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Withdrawal & Payment -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-900">Withdrawals & Payments</h3>
                    <p class="text-gray-600">Manage your earnings</p>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-2">Quick Withdrawal</h4>
                        <p class="text-gray-600 text-sm mb-4">Withdraw your available balance to your bank account or mobile money.</p>
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-sm text-gray-600">Available for withdrawal:</span>
                            <span class="font-bold text-green-600">₦${(
                                stats.availableBalance * 1500
                            ).toLocaleString()}</span>
                        </div>
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm font-medium" ${
                                stats.availableBalance === 0 ? "disabled" : ""
                            }>Withdraw All</button>
                            <button class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium" ${
                                stats.availableBalance === 0 ? "disabled" : ""
                            }>Custom Amount</button>
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-2">Payment Methods</h4>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div class="flex items-center">
                                    <i data-feather="credit-card" class="w-5 h-5 text-blue-600 mr-3"></i>
                                    <span class="text-sm font-medium">Bank Transfer</span>
                                </div>
                                <span class="text-xs text-green-600">Connected</span>
                            </div>
                            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div class="flex items-center">
                                    <i data-feather="smartphone" class="w-5 h-5 text-green-600 mr-3"></i>
                                    <span class="text-sm font-medium">Mobile Money</span>
                                </div>
                                <button class="text-xs text-blue-600 hover:text-blue-700">Add Account</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Earnings Chart -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-900">Earnings Trend</h3>
                    <p class="text-gray-600">Your monthly earnings</p>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">December 2024</span>
                            <span class="font-semibold text-green-600">₦${(
                                stats.thisMonth * 1500
                            ).toLocaleString()}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${Math.min(
                                100,
                                (stats.thisMonth / 1000) * 100
                            )}%"></div>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">November 2024</span>
                            <span class="font-semibold text-green-600">₦${(
                                Math.round(stats.totalEarned * 0.2) * 1500
                            ).toLocaleString()}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${Math.min(
                                100,
                                ((stats.totalEarned * 0.2) / 1000) * 100
                            )}%"></div>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">October 2024</span>
                            <span class="font-semibold text-green-600">₦${(
                                Math.round(stats.totalEarned * 0.3) * 1500
                            ).toLocaleString()}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${Math.min(
                                100,
                                ((stats.totalEarned * 0.3) / 1000) * 100
                            )}%"></div>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">September 2024</span>
                            <span class="font-semibold text-green-600">₦${(
                                Math.round(stats.totalEarned * 0.2) * 1500
                            ).toLocaleString()}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${Math.min(
                                100,
                                ((stats.totalEarned * 0.2) / 1000) * 100
                            )}%"></div>
                        </div>
                    </div>
                    
                    <div class="mt-6 text-center">
                        <button class="text-blue-600 hover:text-blue-700 font-medium">View Detailed Analytics →</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Transactions -->
        <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-900">Recent Transactions</h3>
                <p class="text-gray-600">Your payment history</p>
            </div>
            <div class="p-6">
                ${
                    stats.totalEarned > 0
                        ? `
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div class="flex items-center">
                                <div class="p-2 rounded-full bg-green-100 text-green-600 mr-4">
                                    <i data-feather="plus" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Completed Job</h4>
                                    <p class="text-sm text-gray-600">Payment received for completed work</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="font-bold text-green-600">+₦${(
                                    Math.round(stats.totalEarned * 0.4) * 1500
                                ).toLocaleString()}</span>
                                <p class="text-xs text-gray-500">Completed</p>
                            </div>
                        </div>
                    </div>
                `
                        : `
                    <div class="text-center py-8">
                        <i data-feather="dollar-sign" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                        <h4 class="text-lg font-semibold text-gray-700 mb-2">No Transactions Yet</h4>
                        <p class="text-gray-500">Complete your first job to see earnings here!</p>
                    </div>
                `
                }
                
                <div class="mt-6 text-center">
                    <button class="text-blue-600 hover:text-blue-700 font-medium">View All Transactions →</button>
                </div>
            </div>
        </div>
    `;
    },
    extras: (userData) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Extras & Community</h1>
            <p class="text-gray-600">Coming soon! We're working on exciting new features.</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-12 text-center">
            <div class="max-w-md mx-auto">
                <i data-feather="gift" class="w-16 h-16 text-gray-300 mx-auto mb-6"></i>
                <h3 class="text-2xl font-bold text-gray-700 mb-4">Coming Soon</h3>
                <p class="text-gray-600 mb-6">We're building amazing community features, learning resources, and exclusive extras for apprentices. Stay tuned for updates!</p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-blue-800 text-sm">Features in development:</p>
                    <ul class="text-blue-700 text-sm mt-2 space-y-1">
                        <li>• Community events and workshops</li>
                        <li>• Learning hub with courses</li>
                        <li>• Digital store for selling work</li>
                        <li>• Networking opportunities</li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    gallery: (userData, posts = []) => `
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Portfolio Gallery</h1>
                <p class="text-gray-600">Showcase your skills and work samples</p>
            </div>
            <div class="flex space-x-3">
                <button id="test-storage-gallery-btn" class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm">
                    <i data-feather="database" class="w-4 h-4 inline mr-2"></i>Test Storage
                </button>
                <button id="open-upload-modal" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    <i data-feather="plus" class="w-4 h-4 inline mr-2"></i>Upload Work
                </button>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${
                posts.length > 0
                    ? posts
                          .map(
                              (post) => `
                <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div class="relative group">
                        <img src="${post.image_url}" 
                             alt="${post.title}" 
                             class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105 gallery-image"
                             data-src="${post.image_url}"
                             onerror="this.onerror=null; this.src='https://placehold.co/400x300/EBF4FF/3B82F6?text=Image+Not+Found'; this.classList.add('opacity-50'); console.error('Image failed to load:', '${
                                 post.image_url
                             }');"
                             onload="this.classList.remove('image-loading'); this.classList.add('image-loaded'); console.log('Image loaded successfully:', '${
                                 post.image_url
                             }');">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <button class="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 hover:bg-opacity-100 view-image-btn" 
                                    data-image-url="${post.image_url}" 
                                    data-title="${post.title}">
                                <i data-feather="eye" class="w-4 h-4 inline mr-1"></i>View
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-gray-800 text-lg mb-2">${
                            post.title
                        }</h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${
                            post.description
                        }</p>
                        <div class="flex items-center justify-between text-xs text-gray-400">
                            <span>Posted ${new Date(
                                post.created_at
                            ).toLocaleDateString()}</span>
                            <div class="flex items-center space-x-3">
                                <button class="like-post-btn flex items-center space-x-1 transition-colors ${
                                    post.user_liked
                                        ? "text-red-500"
                                        : "text-gray-400 hover:text-red-500"
                                }" 
                                        data-post-id="${post.id}" 
                                        data-post-liked="${
                                            post.user_liked || false
                                        }">
                                    <i data-feather="heart" class="w-3 h-3 ${
                                        post.user_liked ? "fill-current" : ""
                                    }"></i>
                                    <span class="like-count">${
                                        post.likes || 0
                                    }</span>
                                </button>
                                <button class="delete-post-btn text-red-500 hover:text-red-700 transition-colors" 
                                        data-post-id="${post.id}" 
                                        data-post-title="${post.title}">
                                    <i data-feather="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
                          )
                          .join("")
                    : `
                <div class="col-span-full text-center py-12">
                    <i data-feather="image" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No work uploaded yet</h3>
                    <p class="text-gray-500 mb-6">Start showcasing your skills to get discovered by potential clients</p>
                    <button id="gallery-upload-btn" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Upload Your First Work
                    </button>
                </div>
            `
            }
        </div>
        
        <!-- Image Viewer Modal -->
        <div id="image-viewer-modal" class="modal fixed inset-0 bg-black bg-opacity-90 items-center justify-center z-50 p-4">
            <div class="relative max-w-4xl max-h-full">
                <button id="close-image-viewer" class="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
                    <i data-feather="x" class="w-8 h-8"></i>
                </button>
                <img id="viewer-image" src="" alt="" class="max-w-full max-h-full object-contain">
                <div class="absolute bottom-4 left-4 right-4 text-center">
                    <h3 id="viewer-title" class="text-white text-xl font-bold mb-2"></h3>
                    <p id="viewer-description" class="text-white text-sm opacity-90 hidden"></p>
                </div>
            </div>
        </div>
    `,
    settings: (userData) => `
         <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Settings & Info</h1>
            <p class="text-gray-600">Manage your profile and account settings.</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow max-w-3xl mx-auto">
             <div class="space-y-8 divide-y divide-gray-200">
                <!-- Edit Profile -->
                <div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900">Edit Profile & Skills</h3>
                    <button id="open-edit-profile-modal" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Edit Profile</button>
                </div>
                <!-- Links -->
                <div class="pt-8">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Information</h3>
                     <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a href="#" class="text-blue-600 hover:underline">Terms & Conditions</a>
                        <a href="#" class="text-blue-600 hover:underline">Referral Rules</a>
                        <a href="#" class="text-blue-600 hover:underline">FAQ</a>
                    </div>
                </div>
                <!-- Settings -->
                <div class="pt-8">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Password & Notifications</h3>
                     <div class="mt-4 space-y-4">
                        <button class="text-left text-blue-600 hover:underline">Change Password</button>
                        <div class="relative flex items-start">
                            <div class="flex items-center h-5">
                                <input id="notifications-email" name="notifications-email" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked>
                            </div>
                            <div class="ml-3 text-sm">
                                <label for="notifications-email" class="font-medium text-gray-700">Email Notifications</label>
                                <p class="text-gray-500">Get notified by email about new jobs and messages.</p>
                            </div>
                        </div>
                     </div>
                </div>
                
                <!-- Storage Test (for debugging) -->
                <div class="pt-8">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Storage & System</h3>
                     <div class="mt-4 space-y-4">
                        <button id="test-storage-btn" class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm">
                            <i data-feather="database" class="w-4 h-4 inline mr-2"></i>Test Storage Configuration
                        </button>
                        <p class="text-xs text-gray-500">Use this to diagnose upload issues. Check browser console for results.</p>
                     </div>
                </div>
             </div>
        </div>
    `,
};

// --- Member Templates ---
const memberContentTemplates = {
    home: (userData) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome back, ${
                userData.name || "User"
            }!</h1>
            <p class="text-gray-600">Here's your activity overview</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="stat-card bg-white p-6 rounded-lg shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600"><i data-feather="user-plus"></i></div>
                    <div class="ml-4">
                        <p class="text-sm text-gray-500">Referral Points</p>
                        <p class="text-2xl font-bold">${(
                            userData.referral_points || 0
                        ).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600"><i data-feather="award"></i></div>
                    <div class="ml-4">
                        <p class="text-sm text-gray-500">Eligibility Points</p>
                        <p class="text-2xl font-bold">${(
                            userData.eligibility_points || 0
                        ).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-indigo-100 text-indigo-600"><i data-feather="users"></i></div>
                    <div class="ml-4">
                        <p class="text-sm text-gray-500">Followers</p>
                        <p class="text-2xl font-bold">${
                            userData.followers || 0
                        }</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">Recent Activity</h3>
            <p class="text-gray-600">Your recent points history and notifications will appear here.</p>
        </div>
    `,
    explore: (userData, recommendations = [], searchResults = []) => {
        const currentUserRole = userData.role || "member";
        const targetRoleText =
            currentUserRole === "member" ? "Apprentices" : "Members";
        const targetRoleDescription =
            currentUserRole === "member"
                ? "skilled apprentices looking for opportunities"
                : "creative members to collaborate with";

        return `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Explore ${targetRoleText}</h1>
            <p class="text-gray-600">Discover and connect with ${targetRoleDescription}</p>
        </div>
        
        <!-- Search Bar -->
        <div class="mb-8 bg-white p-6 rounded-lg shadow">
            <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="Search by name, ${
                            currentUserRole === "member"
                                ? "skill"
                                : "creative type"
                        }, or location..." 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                </div>
                <div>
                    <select id="filter-creative-type" class="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">${
                            currentUserRole === "member"
                                ? "All Skills"
                                : "All Creative Types"
                        }</option>
                        ${
                            currentUserRole === "member"
                                ? `
                            <option value="photography">Photography</option>
                            <option value="design">Design</option>
                            <option value="programming">Programming</option>
                            <option value="art">Art & Craft</option>
                            <option value="writing">Writing</option>
                        `
                                : `
                            <option value="Photographer">Photographer</option>
                            <option value="Designer">Designer</option>
                            <option value="Artisan">Artisan</option>
                            <option value="Student">Student</option>
                            <option value="Programmer">Programmer</option>
                            <option value="Other">Other</option>
                        `
                        }
                    </select>
                </div>
                <button id="search-btn" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                    <i data-feather="search" class="w-4 h-4 mr-2"></i>
                    Search
                </button>
            </div>
        </div>

        <!-- Search Results -->
        <div id="search-results" class="mb-8 ${
            searchResults.length > 0 ? "" : "hidden"
        }">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Search Results</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${searchResults
                    .map(
                        (user) => `
                    <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div class="flex items-center mb-4">
                            <img src="https://placehold.co/60x60/EBF4FF/3B82F6?text=${
                                user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : "U"
                            }" 
                                 alt="${user.name}" 
                                 class="w-12 h-12 rounded-full mr-4">
                            <div>
                                <h4 class="font-semibold text-gray-900">${
                                    user.name || "Unknown User"
                                }</h4>
                                <p class="text-sm text-gray-600">${
                                    user.role === "apprentice"
                                        ? user.skill || "Apprentice"
                                        : user.creative_type || "Creative"
                                }</p>
                                ${
                                    user.location
                                        ? `<p class="text-xs text-gray-500">${user.location}</p>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
                            <span>${user.followers || 0} followers</span>
                            ${
                                user.role === "member"
                                    ? `
                                <span>${(
                                    (user.referral_points || 0) +
                                    (user.eligibility_points || 0)
                                ).toLocaleString()} pts</span>
                            `
                                    : ""
                            }
                        </div>
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 follow-btn" 
                                    data-user-id="${user.id}">
                                ${
                                    currentUserRole === "member" &&
                                    user.role === "apprentice"
                                        ? "Connect"
                                        : "Follow"
                                }
                            </button>
                        </div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        </div>

        <!-- Recommended for You -->
        <div class="mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Recommended for You</h3>
            <p class="text-gray-600 mb-6">Based on your ${
                currentUserRole === "member" ? "creative type" : "skills"
            }: ${
            currentUserRole === "member"
                ? userData.creative_type || "Creative"
                : userData.skill || "Your expertise"
        }</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${
                    recommendations.length > 0
                        ? recommendations
                              .map(
                                  (user) => `
                    <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div class="flex items-center mb-4">
                            <img src="https://placehold.co/60x60/EBF4FF/3B82F6?text=${
                                user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : "U"
                            }" 
                                 alt="${user.name}" 
                                 class="w-12 h-12 rounded-full mr-4">
                            <div>
                                <h4 class="font-semibold text-gray-900">${
                                    user.name || "Unknown User"
                                }</h4>
                                <p class="text-sm text-gray-600">${
                                    user.role === "apprentice"
                                        ? user.skill || "Apprentice"
                                        : user.creative_type || "Creative"
                                }</p>
                                ${
                                    user.location
                                        ? `<p class="text-xs text-gray-500">${user.location}</p>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
                            <span>${user.followers || 0} followers</span>
                            ${
                                user.role === "member"
                                    ? `
                                <span>${(
                                    (user.referral_points || 0) +
                                    (user.eligibility_points || 0)
                                ).toLocaleString()} pts</span>
                            `
                                    : ""
                            }
                        </div>
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 follow-btn" 
                                    data-user-id="${user.id}">
                                ${
                                    currentUserRole === "member" &&
                                    user.role === "apprentice"
                                        ? "Connect"
                                        : "Follow"
                                }
                            </button>
                        </div>
                    </div>
                `
                              )
                              .join("")
                        : `
                    <div class="col-span-full text-center py-12">
                        <i data-feather="users" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-700 mb-2">No recommendations yet</h3>
                        <p class="text-gray-500">Complete your profile to get personalized recommendations</p>
                    </div>
                `
                }
            </div>
        </div>
    `;
    },
    profile: (userData) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Profile</h1>
            <p class="text-gray-600">Manage your account information</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto">
            <div class="flex flex-col sm:flex-row items-center sm:space-x-8">
                <img src="${
                    userAvatarEl.src
                }" alt="Profile" class="w-32 h-32 rounded-full object-cover border-4 border-gray-200">
                <div class="text-center sm:text-left mt-4 sm:mt-0">
                    <h2 class="text-3xl font-bold">${
                        userData.name || "User"
                    }</h2>
                    <p class="text-gray-600 mt-1">${
                        userData.creative_type || "Creative"
                    }</p>
                    <p class="text-sm text-gray-500 mt-2">${
                        userData.email || ""
                    }</p>
                    <button id="open-edit-profile-modal" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Edit Profile</button>
                </div>
            </div>
            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800">Account Type</h4>
                    <p class="text-gray-600 capitalize">${
                        userData.role || "Member"
                    }</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800">Subscription Plan</h4>
                    <p class="text-gray-600">${
                        subscriptionPlans[userData.subscription_plan || "free"]
                            .name
                    }</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800">Member Since</h4>
                    <p class="text-gray-600">${
                        userData.created_at
                            ? new Date(userData.created_at).toLocaleDateString()
                            : "Recently"
                    }</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800">Total Points</h4>
                    <p class="text-gray-600">${(
                        (userData.referral_points || 0) +
                        (userData.eligibility_points || 0)
                    ).toLocaleString()}</p>
                </div>
            </div>
        </div>
    `,
    gallery: (userData, posts = []) => `
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Gallery</h1>
                <p class="text-gray-600">Showcase your creative work</p>
            </div>
            <div class="flex space-x-3">
                <button id="test-storage-gallery-btn" class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm">
                    <i data-feather="database" class="w-4 h-4 inline mr-2"></i>Test Storage
                </button>
                <button id="open-upload-modal" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    <i data-feather="plus" class="w-4 h-4 inline mr-2"></i>Upload Work
                </button>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${
                posts.length > 0
                    ? posts
                          .map(
                              (post) => `
                <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div class="relative group">
                        <img src="${post.image_url}" 
                             alt="${post.title}" 
                             class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105 gallery-image"
                             data-src="${post.image_url}"
                             onerror="this.onerror=null; this.src='https://placehold.co/400x300/EBF4FF/3B82F6?text=Image+Not+Found'; this.classList.add('opacity-50'); console.error('Image failed to load:', '${
                                 post.image_url
                             }');"
                             onload="this.classList.remove('image-loading'); this.classList.add('image-loaded'); console.log('Image loaded successfully:', '${
                                 post.image_url
                             }');">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <button class="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 hover:bg-opacity-100 view-image-btn" 
                                    data-image-url="${post.image_url}" 
                                    data-title="${post.title}">
                                <i data-feather="eye" class="w-4 h-4 inline mr-1"></i>View
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-gray-800 text-lg mb-2">${
                            post.title
                        }</h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${
                            post.description
                        }</p>
                        <div class="flex items-center justify-between text-xs text-gray-400">
                            <span>Posted ${new Date(
                                post.created_at
                            ).toLocaleDateString()}</span>
                            <div class="flex items-center space-x-3">
                                <button class="like-post-btn flex items-center space-x-1 transition-colors ${
                                    post.user_liked
                                        ? "text-red-500"
                                        : "text-gray-400 hover:text-red-500"
                                }" 
                                        data-post-id="${post.id}" 
                                        data-post-liked="${
                                            post.user_liked || false
                                        }">
                                    <i data-feather="heart" class="w-3 h-3 ${
                                        post.user_liked ? "fill-current" : ""
                                    }"></i>
                                    <span class="like-count">${
                                        post.likes || 0
                                    }</span>
                                </button>
                                <button class="delete-post-btn text-red-500 hover:text-red-700 transition-colors" 
                                        data-post-id="${post.id}" 
                                        data-post-title="${post.title}">
                                    <i data-feather="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
                          )
                          .join("")
                    : `
                <div class="col-span-full text-center py-12">
                    <i data-feather="image" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No work uploaded yet</h3>
                    <p class="text-gray-500 mb-6">Start showcasing your creative work to get discovered</p>
                    <div class="space-y-4">
                        <button id="test-storage-empty-gallery-btn" class="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 text-sm mx-2">
                            <i data-feather="database" class="w-4 h-4 inline mr-2"></i>Test Storage First
                        </button>
                        <button id="gallery-upload-btn" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mx-2">
                            Upload Your First Work
                        </button>
                    </div>
                </div>
            `
            }
        </div>
        
        <!-- Image Viewer Modal -->
        <div id="image-viewer-modal" class="modal fixed inset-0 bg-black bg-opacity-90 items-center justify-center z-50 p-4">
            <div class="relative max-w-4xl max-h-full">
                <button id="close-image-viewer" class="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
                    <i data-feather="x" class="w-8 h-8"></i>
                </button>
                <img id="viewer-image" src="" alt="" class="max-w-full max-h-full object-contain">
                <div class="absolute bottom-4 left-4 right-4 text-center">
                    <h3 id="viewer-title" class="text-white text-xl font-bold mb-2"></h3>
                    <p id="viewer-description" class="text-white text-sm opacity-90 hidden"></p>
                </div>
            </div>
        </div>
    `,
    subscription: (userData) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Subscription</h1>
            <p class="text-gray-600">Upgrade your plan to unlock more features</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${Object.entries(subscriptionPlans)
                .map(
                    ([key, plan]) => `
                <div class="bg-white p-6 rounded-lg shadow ${
                    userData.subscription_plan === key
                        ? "ring-2 ring-blue-500"
                        : ""
                }">
                    <h3 class="text-xl font-bold mb-2">${plan.name}</h3>
                    <p class="text-3xl font-bold text-blue-600 mb-4">₦${
                        plan.price
                    }<span class="text-sm text-gray-500">/month</span></p>
                    <ul class="space-y-2 mb-6">
                        ${
                            plan.unlocks.includes("*")
                                ? [
                                      "All Features",
                                      "Priority Support",
                                      "Advanced Analytics",
                                  ]
                                      .map(
                                          (feature) =>
                                              `<li class="flex items-center"><i data-feather="check" class="w-4 h-4 text-green-500 mr-2"></i>${feature}</li>`
                                      )
                                      .join("")
                                : plan.unlocks
                                      .map(
                                          (feature) =>
                                              `<li class="flex items-center"><i data-feather="check" class="w-4 h-4 text-green-500 mr-2"></i>${feature.replace(
                                                  "_",
                                                  " "
                                              )}</li>`
                                      )
                                      .join("")
                        }
                    </ul>
                    ${
                        userData.subscription_plan === key
                            ? '<button class="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed">Current Plan</button>'
                            : plan.price === 0
                            ? '<button class="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed">Free Plan</button>'
                            : `<button class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 upgrade-btn" data-plan="${key}">Upgrade Now</button>`
                    }
                </div>
            `
                )
                .join("")}
        </div>
    `,
    earnings: async (userData) => {
        // Get referral data
        let referralCode = null;
        let referralStats = [];

        try {
            referralCode = await getUserReferralCode(userData.id);
            referralStats = await getUserReferralStats(userData.id);
        } catch (error) {
            console.error("Error fetching referral data:", error);
        }

        const inviteLink = referralCode
            ? `${window.location.origin}/craftnet-supabase.html?ref=${referralCode.code}`
            : null;

        return `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Earn Points</h1>
            <p class="text-gray-600">Complete tasks and refer friends to earn points</p>
        </div>
        
        <!-- Referral Section -->
        <div class="bg-white p-6 rounded-lg shadow mb-8">
            <h3 class="text-xl font-bold mb-4">Your Referral Link</h3>
            <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-2">Share Your Invite Link</h4>
                    <p class="text-gray-600 text-sm mb-4">Share this link with friends and earn 100 points for each successful referral!</p>
                    
                    ${
                        inviteLink
                            ? `
                        <div class="flex items-center space-x-2 mb-4">
                            <input type="text" value="${inviteLink}" readonly 
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono">
                            <button onclick="copyToClipboard('${inviteLink}')" 
                                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                                Copy
                            </button>
                        </div>
                        <div class="flex items-center justify-between text-sm text-gray-600">
                            <span>Referral Code: <span class="font-mono font-semibold">${referralCode.code}</span></span>
                            <span>Total Referrals: <span class="font-semibold">${referralCode.total_referrals}</span></span>
                        </div>
                    `
                            : `
                        <div class="text-center py-4">
                            <p class="text-gray-500">Loading your referral link...</p>
                        </div>
                    `
                    }
                </div>
                
                ${
                    referralStats.length > 0
                        ? `
                    <div class="border-t border-gray-200 pt-4">
                        <h5 class="font-semibold text-gray-900 mb-3">Recent Referrals</h5>
                        <div class="space-y-2">
                            ${referralStats
                                .slice(0, 5)
                                .map(
                                    (referral) => `
                                <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div class="flex items-center">
                                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                            <span class="text-blue-600 font-semibold text-sm">${
                                                referral.referred_user?.name?.charAt(
                                                    0
                                                ) || "U"
                                            }</span>
                                        </div>
                                        <div>
                                            <p class="font-medium text-sm">${
                                                referral.referred_user?.name ||
                                                "Unknown User"
                                            }</p>
                                            <p class="text-xs text-gray-500">${new Date(
                                                referral.created_at
                                            ).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span class="text-green-600 font-semibold">+${
                                        referral.points_awarded
                                    } pts</span>
                                </div>
                            `
                                )
                                .join("")}
                        </div>
                    </div>
                `
                        : ""
                }
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-bold mb-4">Your Points</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span class="text-green-800">Referral Points</span>
                        <span class="font-bold text-green-600">${(
                            userData.referral_points || 0
                        ).toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span class="text-blue-800">Eligibility Points</span>
                        <span class="font-bold text-blue-600">${(
                            userData.eligibility_points || 0
                        ).toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span class="text-gray-800">Total Points</span>
                        <span class="font-bold text-gray-600">${(
                            (userData.referral_points || 0) +
                            (userData.eligibility_points || 0)
                        ).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-bold mb-4">How to Earn</h3>
                <div class="space-y-3">
                    <div class="flex items-center p-3 border rounded-lg">
                        <i data-feather="user-plus" class="w-6 h-6 text-green-500 mr-3"></i>
                        <div>
                            <p class="font-semibold">Refer a Friend</p>
                            <p class="text-sm text-gray-600">Earn 100 points per referral</p>
                        </div>
                    </div>
                    <div class="flex items-center p-3 border rounded-lg">
                        <i data-feather="upload" class="w-6 h-6 text-blue-500 mr-3"></i>
                        <div>
                            <p class="font-semibold">Upload Work</p>
                            <p class="text-sm text-gray-600">Earn 50 points per upload</p>
                        </div>
                    </div>
                    <div class="flex items-center p-3 border rounded-lg">
                        <i data-feather="heart" class="w-6 h-6 text-red-500 mr-3"></i>
                        <div>
                            <p class="font-semibold">Get Followers</p>
                            <p class="text-sm text-gray-600">Earn 25 points per follower</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    },
    jobs: async (userData) => {
        // Get client job requests
        let myJobRequests = [];
        let clientStats = {
            totalJobs: 0,
            openJobs: 0,
            inProgressJobs: 0,
            completedJobs: 0,
            totalSpent: 0,
        };

        try {
            myJobRequests = await getClientJobRequests(userData.id);
            clientStats = await getClientStats(userData.id);
        } catch (error) {
            console.error("Error fetching job requests:", error);
        }

        return `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Job Requests</h1>
            <p class="text-gray-600">Create and manage job requests for skilled apprentices.</p>
        </div>
        
        <!-- Job Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="briefcase" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Total Jobs</h3>
                <p class="text-3xl font-bold mt-2 text-blue-600">${
                    clientStats.totalJobs
                }</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="clock" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Open Jobs</h3>
                <p class="text-3xl font-bold mt-2 text-green-600">${
                    clientStats.openJobs
                }</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="play" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">In Progress</h3>
                <p class="text-3xl font-bold mt-2 text-yellow-600">${
                    clientStats.inProgressJobs
                }</p>
            </div>
            <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                <div class="p-3 rounded-full bg-purple-100 text-purple-600 mx-auto w-12 h-12 flex items-center justify-center mb-3">
                    <i data-feather="dollar-sign" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-medium text-gray-500">Total Spent</h3>
                <p class="text-3xl font-bold mt-2 text-purple-600">₦${(
                    clientStats.totalSpent * 1500
                ).toLocaleString()}</p>
            </div>
        </div>

        <!-- Create New Job Request -->
        <div class="bg-white rounded-lg shadow mb-8">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-900">Create New Job Request</h3>
                <p class="text-gray-600">Post a new job for skilled apprentices to apply</p>
            </div>
            <div class="p-6">
                <form id="create-job-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="job-title" class="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                            <input type="text" id="job-title" name="title" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Website Design for Restaurant">
                        </div>
                        <div>
                            <label for="job-location" class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input type="text" id="job-location" name="location"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Lagos, Nigeria or Remote">
                        </div>
                    </div>
                    
                    <div>
                        <label for="job-description" class="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                        <textarea id="job-description" name="description" rows="4" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe the job requirements, deliverables, and any specific details..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label for="job-budget-min" class="block text-sm font-medium text-gray-700 mb-2">Minimum Budget ($)</label>
                            <input type="number" id="job-budget-min" name="budgetMin" required min="1"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="100">
                        </div>
                        <div>
                            <label for="job-budget-max" class="block text-sm font-medium text-gray-700 mb-2">Maximum Budget ($)</label>
                            <input type="number" id="job-budget-max" name="budgetMax" required min="1"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="500">
                        </div>
                        <div>
                            <label for="job-deadline" class="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                            <input type="date" id="job-deadline" name="deadline" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <div>
                        <label for="job-skills" class="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                        <select id="job-skills" name="skillsRequired" multiple
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="photography">Photography</option>
                            <option value="design">Design</option>
                            <option value="programming">Programming</option>
                            <option value="writing">Writing</option>
                            <option value="art">Art & Craft</option>
                            <option value="video">Video Editing</option>
                            <option value="marketing">Digital Marketing</option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple skills</p>
                    </div>
                    
                    <div class="flex justify-end">
                        <button type="submit" id="create-job-btn"
                            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center">
                            <i data-feather="plus" class="w-4 h-4 mr-2"></i>
                            Create Job Request
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- My Job Requests -->
        <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-900">My Job Requests</h3>
                <p class="text-gray-600">Manage your posted jobs and applications</p>
            </div>
            <div class="p-6">
                ${
                    myJobRequests.length > 0
                        ? `
                    <div class="space-y-6">
                        ${myJobRequests
                            .map(
                                (job) => `
                            <div class="border border-gray-200 rounded-lg p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 class="text-xl font-semibold text-gray-900">${
                                            job.title
                                        }</h4>
                                        <p class="text-gray-600 mt-1">${
                                            job.description
                                        }</p>
                                    </div>
                                    <span class="bg-${
                                        job.status === "open"
                                            ? "green"
                                            : job.status === "in_progress"
                                            ? "blue"
                                            : "purple"
                                    }-100 text-${
                                    job.status === "open"
                                        ? "green"
                                        : job.status === "in_progress"
                                        ? "blue"
                                        : "purple"
                                }-800 text-xs px-3 py-1 rounded-full capitalize">${job.status.replace(
                                    "_",
                                    " "
                                )}</span>
                                </div>
                                
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">Budget:</span>
                                                                <span class="font-medium">₦${(
                                                                    job.budget_min *
                                                                    1500
                                                                ).toLocaleString()}-₦${(
                                    job.budget_max * 1500
                                ).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Location:</span>
                                        <span class="font-medium">${
                                            job.location || "Remote"
                                        }</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Deadline:</span>
                                        <span class="font-medium">${new Date(
                                            job.deadline
                                        ).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Applications:</span>
                                        <span class="font-medium">${
                                            job.applications?.length || 0
                                        }</span>
                                    </div>
                                </div>
                                
                                ${
                                    job.applications &&
                                    job.applications.length > 0
                                        ? `
                                    <div class="border-t border-gray-200 pt-4">
                                        <h5 class="font-semibold text-gray-900 mb-3">Applications (${
                                            job.applications.length
                                        })</h5>
                                        <div class="space-y-3">
                                            ${job.applications
                                                .map(
                                                    (app) => `
                                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div class="flex items-center">
                                                        <img src="https://placehold.co/40x40/EBF4FF/3B82F6?text=${
                                                            app.apprentice?.name?.charAt(
                                                                0
                                                            ) || "A"
                                                        }" 
                                                             alt="${
                                                                 app.apprentice
                                                                     ?.name
                                                             }" 
                                                             class="w-10 h-10 rounded-full mr-3">
                                                        <div>
                                                            <h6 class="font-medium text-gray-900">${
                                                                app.apprentice
                                                                    ?.name ||
                                                                "Anonymous"
                                                            }</h6>
                                                            <p class="text-sm text-gray-600">${
                                                                app.apprentice
                                                                    ?.skill ||
                                                                "Apprentice"
                                                            } • ${
                                                        app.apprentice
                                                            ?.location ||
                                                        "Unknown"
                                                    }</p>
                                                        </div>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        ${
                                                            app.status ===
                                                            "pending"
                                                                ? `
                                                            <button class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 accept-app-btn" data-app-id="${app.id}">Accept</button>
                                                            <button class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 reject-app-btn" data-app-id="${app.id}">Reject</button>
                                                        `
                                                                : `
                                                            <span class="bg-${
                                                                app.status ===
                                                                "accepted"
                                                                    ? "green"
                                                                    : "red"
                                                            }-100 text-${
                                                                      app.status ===
                                                                      "accepted"
                                                                          ? "green"
                                                                          : "red"
                                                                  }-800 text-xs px-2 py-1 rounded-full capitalize">${
                                                                      app.status
                                                                  }</span>
                                                        `
                                                        }
                                                    </div>
                                                </div>
                                            `
                                                )
                                                .join("")}
                                        </div>
                                    </div>
                                `
                                        : ""
                                }
                                
                                <div class="flex justify-end space-x-2 mt-4">
                                    <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm">Edit Job</button>
                                    <button class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">Delete Job</button>
                                </div>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                `
                        : `
                    <div class="text-center py-12">
                        <i data-feather="briefcase" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                        <h4 class="text-xl font-semibold text-gray-700 mb-2">No Job Requests Yet</h4>
                        <p class="text-gray-500">Create your first job request to find skilled apprentices!</p>
                    </div>
                `
                }
            </div>
        </div>
    `;
    },
    leaderboard: (userData, topUsers = []) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p class="text-gray-600">See how you rank among other creators</p>
        </div>
        <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
                <h3 class="text-xl font-bold">Top Creators</h3>
            </div>
            <div class="divide-y">
                ${
                    topUsers.length > 0
                        ? topUsers
                              .map(
                                  (user, index) => `
                    <div class="p-6 flex items-center justify-between ${
                        user.id === userData.id ? "bg-blue-50" : ""
                    }">
                        <div class="flex items-center">
                            <span class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-sm mr-4">${
                                index + 1
                            }</span>
                            <div>
                                <p class="font-semibold">${user.name}</p>
                                <p class="text-sm text-gray-600">${
                                    user.creative_type || "Creator"
                                }</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold">${(
                                (user.referral_points || 0) +
                                (user.eligibility_points || 0)
                            ).toLocaleString()} pts</p>
                            <p class="text-sm text-gray-500">${
                                user.followers || 0
                            } followers</p>
                        </div>
                    </div>
                `
                              )
                              .join("")
                        : `
                    <div class="p-12 text-center">
                        <i data-feather="users" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                        <p class="text-gray-500">No leaderboard data available yet</p>
                    </div>
                `
                }
            </div>
        </div>
    `,
};

// --- Explore Tab Functions ---
async function fetchRecommendations(userData) {
    try {
        console.log(
            "Fetching recommendations for:",
            userData.creative_type,
            "role:",
            userData.role
        );

        const currentUserRole = userData.role || "member";
        const targetRole =
            currentUserRole === "member" ? "apprentice" : "member";
        let recommendations = [];

        if (currentUserRole === "member") {
            // Members see apprentices with similar skills to their creative type
            const creativeTypeKeywords = {
                Photographer: ["photography", "photo", "camera", "visual"],
                Designer: ["design", "graphic", "ui", "ux", "web"],
                Artisan: ["craft", "art", "handmade", "creative"],
                Student: ["student", "learning", "education"],
                Programmer: [
                    "programming",
                    "coding",
                    "development",
                    "software",
                    "web",
                ],
            };

            const keywords = creativeTypeKeywords[userData.creative_type] || [];
            const allApprentices = await getUsersByRole("apprentice", 20);

            if (keywords.length > 0) {
                recommendations = allApprentices.filter((apprentice) => {
                    const skill = (apprentice.skill || "").toLowerCase();
                    return keywords.some((keyword) =>
                        skill.includes(keyword.toLowerCase())
                    );
                });
            }

            if (recommendations.length < 6) {
                const remainingApprentices = allApprentices.filter(
                    (apprentice) =>
                        !recommendations.find((r) => r.id === apprentice.id)
                );
                recommendations = [
                    ...recommendations,
                    ...remainingApprentices,
                ].slice(0, 6);
            }
        } else {
            // Apprentices see members with similar creative types
            const apprenticeSkill = userData.skill || "";
            let targetCreativeType = "";

            if (
                apprenticeSkill.toLowerCase().includes("photo") ||
                apprenticeSkill.toLowerCase().includes("camera")
            ) {
                targetCreativeType = "Photographer";
            } else if (
                apprenticeSkill.toLowerCase().includes("design") ||
                apprenticeSkill.toLowerCase().includes("ui") ||
                apprenticeSkill.toLowerCase().includes("graphic")
            ) {
                targetCreativeType = "Designer";
            } else if (
                apprenticeSkill.toLowerCase().includes("program") ||
                apprenticeSkill.toLowerCase().includes("code") ||
                apprenticeSkill.toLowerCase().includes("web")
            ) {
                targetCreativeType = "Programmer";
            } else if (
                apprenticeSkill.toLowerCase().includes("art") ||
                apprenticeSkill.toLowerCase().includes("craft")
            ) {
                targetCreativeType = "Artisan";
            }

            try {
                if (targetCreativeType) {
                    recommendations = await searchUsers(
                        "",
                        targetCreativeType,
                        "member",
                        6
                    );
                } else {
                    recommendations = await getUsersByRole("member", 6);
                }
            } catch (error) {
                console.log("Error with targeted query, using basic query");
                recommendations = await getUsersByRole("member", 6);
            }
        }

        recommendations = recommendations.filter(
            (user) => user.id !== userData.id
        );
        console.log("Found recommendations:", recommendations.length);
        return recommendations;
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return [];
    }
}

function attachDynamicEventListeners(tabId, userData) {
    // Gallery modal event handlers (available on all tabs)
    const galleryModal = document.getElementById("gallery-view-modal");
    if (galleryModal) {
        // Close modal when clicking outside
        galleryModal.addEventListener("click", (e) => {
            if (e.target === galleryModal) {
                galleryModal.classList.remove("active");
            }
        });

        // Close modal with close button
        const closeGalleryModal = document.getElementById(
            "close-gallery-modal"
        );
        if (closeGalleryModal) {
            closeGalleryModal.addEventListener("click", () => {
                galleryModal.classList.remove("active");
            });
        }

        // Handle like buttons in gallery modal
        galleryModal.addEventListener("click", async (e) => {
            if (e.target.closest(".like-post-btn")) {
                e.preventDefault();
                e.stopPropagation();

                const likeBtn = e.target.closest(".like-post-btn");
                const postId = likeBtn.dataset.postId;
                const isCurrentlyLiked = likeBtn.dataset.postLiked === "true";

                try {
                    const {
                        data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) {
                        showNotification(
                            "Please log in to like posts",
                            "error"
                        );
                        return;
                    }

                    const result = await togglePostLike(postId, user.id);

                    // Update button state
                    if (result.liked) {
                        likeBtn.classList.remove("text-gray-500");
                        likeBtn.classList.add("text-red-500");
                        likeBtn
                            .querySelector("i")
                            .classList.add("fill-current");
                        likeBtn.dataset.postLiked = "true";
                    } else {
                        likeBtn.classList.remove("text-red-500");
                        likeBtn.classList.add("text-gray-500");
                        likeBtn
                            .querySelector("i")
                            .classList.remove("fill-current");
                        likeBtn.dataset.postLiked = "false";
                    }

                    // Update like count
                    const likeCountEl = likeBtn
                        .closest(".gallery-image-container")
                        .querySelector(".text-xs span:last-child");
                    if (likeCountEl) {
                        const currentCount =
                            parseInt(likeCountEl.textContent) || 0;
                        likeCountEl.textContent = result.liked
                            ? currentCount + 1
                            : Math.max(0, currentCount - 1);
                    }
                } catch (error) {
                    console.error("Error toggling like:", error);
                    showNotification("Failed to update like", "error");
                }
            }
        });
    }

    // Shared functionality
    if (tabId === "settings" || tabId === "profile") {
        const editProfileBtn = document.getElementById(
            "open-edit-profile-modal"
        );
        if (editProfileBtn) {
            editProfileBtn.addEventListener("click", () => {
                document.getElementById("edit-name").value =
                    userData.name || "";
                // Only show creative type for members
                const creativeTypeField =
                    document.getElementById("edit-creative-type");
                if (userData.role === "member") {
                    creativeTypeField.value = userData.creative_type || "";
                    creativeTypeField.parentElement.style.display = "block";
                } else {
                    creativeTypeField.parentElement.style.display = "none";
                }
                editProfileModal.classList.add("active");
            });
        }
    }

    // Member-specific listeners
    if (userData.role === "member") {
        if (tabId === "gallery") {
            const openUploadModalBtn =
                document.getElementById("open-upload-modal");
            if (openUploadModalBtn) {
                openUploadModalBtn.addEventListener("click", () =>
                    uploadModal.classList.add("active")
                );
            }
            const galleryUploadBtn =
                document.getElementById("gallery-upload-btn");
            if (galleryUploadBtn) {
                galleryUploadBtn.addEventListener("click", () =>
                    uploadModal.classList.add("active")
                );
            }

            // Add test storage button listener
            const testStorageBtn = document.getElementById(
                "test-storage-gallery-btn"
            );
            if (testStorageBtn) {
                testStorageBtn.addEventListener("click", async () => {
                    testStorageBtn.disabled = true;
                    testStorageBtn.textContent = "Testing...";

                    const success = await testStorageConfiguration();

                    if (success) {
                        showNotification(
                            "Storage test completed successfully! Check console for details.",
                            "success"
                        );
                    } else {
                        showNotification(
                            "Storage test failed. Check console for details.",
                            "error"
                        );
                    }

                    testStorageBtn.disabled = false;
                    testStorageBtn.innerHTML =
                        '<i data-feather="database" class="w-4 h-4 inline mr-2"></i>Test Storage';
                    feather.replace();
                });
            }
        }

        if (tabId === "explore") {
            setTimeout(() => {
                const searchBtn = document.getElementById("search-btn");
                const searchInput = document.getElementById("search-input");

                if (searchBtn && searchInput) {
                    const newSearchBtn = searchBtn.cloneNode(true);
                    searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

                    const newSearchInput = searchInput.cloneNode(true);
                    searchInput.parentNode.replaceChild(
                        newSearchInput,
                        searchInput
                    );

                    newSearchBtn.addEventListener("click", handleSearch);
                    newSearchInput.addEventListener("keypress", (e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearch();
                        }
                    });
                }
            }, 100);

            async function handleSearch() {
                const searchInput = document.getElementById("search-input");
                const filterSelect = document.getElementById(
                    "filter-creative-type"
                );
                const searchBtn = document.getElementById("search-btn");

                const searchTerm = searchInput.value.trim();
                const creativeTypeFilter = filterSelect.value;

                if (!searchTerm && !creativeTypeFilter) {
                    alert("Please enter a search term or select a filter.");
                    return;
                }

                searchBtn.disabled = true;
                searchBtn.innerHTML = `<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>Searching...`;

                const targetRole =
                    userData.role === "member" ? "apprentice" : "member";
                const results = await searchUsers(
                    searchTerm,
                    creativeTypeFilter,
                    targetRole
                );
                displaySearchResults(results);

                searchBtn.disabled = false;
                searchBtn.innerHTML = `<i data-feather="search" class="w-4 h-4 mr-2"></i>Search`;
                feather.replace();
            }
        }
    }

    // Settings-specific listeners
    if (tabId === "settings") {
        const testStorageBtn = document.getElementById("test-storage-btn");
        if (testStorageBtn) {
            testStorageBtn.addEventListener("click", async () => {
                testStorageBtn.disabled = true;
                testStorageBtn.textContent = "Testing...";

                const success = await testStorageConfiguration();

                if (success) {
                    showNotification(
                        "Storage test completed successfully! Check console for details.",
                        "success"
                    );
                } else {
                    showNotification(
                        "Storage test failed. Check console for details.",
                        "error"
                    );
                }

                testStorageBtn.disabled = false;
                testStorageBtn.innerHTML =
                    '<i data-feather="database" class="w-4 h-4 inline mr-2"></i>Test Storage Configuration';
                feather.replace();
            });
        }
    }
}

function updateFollowerCountInUI(targetUserId) {
    try {
        console.log("Updating UI for user:", targetUserId);

        // Find all follower count elements for this user
        const followerElements = document.querySelectorAll(
            `[data-user-id="${targetUserId}"]`
        );

        followerElements.forEach((element) => {
            // Find the follower count span within this user's card
            const userCard = element.closest(".bg-white");
            if (userCard) {
                // Look for follower count text
                const followerSpans = userCard.querySelectorAll("span");
                followerSpans.forEach((span) => {
                    const text = span.textContent;
                    // Match patterns like "5 followers", "0 followers", etc.
                    if (text.includes(" follower")) {
                        const currentCount = parseInt(
                            text.match(/\d+/)?.[0] || "0"
                        );
                        const newCount = currentCount + 1;
                        span.textContent = `${newCount} follower${
                            newCount !== 1 ? "s" : ""
                        }`;
                        console.log(
                            `Updated follower count from ${currentCount} to ${newCount}`
                        );
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error updating UI:", error);
    }
}

// Global button handlers
document.addEventListener("click", async (e) => {
    // Follow button handler
    if (e.target.classList.contains("follow-btn")) {
        e.preventDefault();
        e.stopPropagation();

        const targetUserId = e.target.dataset.userId;
        const targetUserName = e.target.dataset.userName || "User";

        // Show user profile modal instead of directly following
        await showUserProfileModal(targetUserId, targetUserName);
    }

    // Like button handler
    if (e.target.closest(".like-post-btn")) {
        e.preventDefault();
        e.stopPropagation();

        const likeBtn = e.target.closest(".like-post-btn");
        const postId = likeBtn.dataset.postId;
        const isCurrentlyLiked = likeBtn.dataset.postLiked === "true";

        // Get current user from Supabase
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            alert("Please log in to like posts");
            return;
        }

        try {
            const success = await togglePostLike(user.id, postId);
            if (success) {
                // Update UI
                const heartIcon = likeBtn.querySelector(
                    "i[data-feather='heart']"
                );
                const likeCount = likeBtn.querySelector(".like-count");

                if (isCurrentlyLiked) {
                    // Unlike
                    likeBtn.dataset.postLiked = "false";
                    heartIcon.classList.remove("fill-current");
                    likeBtn.classList.remove("text-red-500");
                    likeBtn.classList.add(
                        "text-gray-400",
                        "hover:text-red-500"
                    );
                    likeCount.textContent = parseInt(likeCount.textContent) - 1;
                } else {
                    // Like
                    likeBtn.dataset.postLiked = "true";
                    heartIcon.classList.add("fill-current");
                    likeBtn.classList.remove(
                        "text-gray-400",
                        "hover:text-red-500"
                    );
                    likeBtn.classList.add("text-red-500");
                    likeCount.textContent = parseInt(likeCount.textContent) + 1;
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            alert("Error liking post. Please try again.");
        }
    }

    // Job application handler
    if (e.target.textContent === "Apply Now") {
        e.preventDefault();
        const jobCard = e.target.closest(".border");
        const jobTitle = jobCard.querySelector("h4").textContent;
        const jobAmount = jobCard.querySelector(".bg-green-100").textContent;

        if (confirm(`Apply for "${jobTitle}" (${jobAmount})?`)) {
            e.target.textContent = "Applied";
            e.target.classList.remove("bg-blue-600", "hover:bg-blue-700");
            e.target.classList.add("bg-green-600", "cursor-not-allowed");
            e.target.disabled = true;

            // Show success notification
            showNotification(
                `Successfully applied for ${jobTitle}!`,
                "success"
            );
        }
    }

    // Withdrawal handler
    if (e.target.textContent === "Withdraw All") {
        e.preventDefault();
        if (
            confirm("Withdraw your entire available balance (₦1,920,000.00)?")
        ) {
            e.target.textContent = "Processing...";
            e.target.disabled = true;

            // Simulate processing
            setTimeout(() => {
                e.target.textContent = "Withdrawal Successful";
                e.target.classList.remove("bg-green-600", "hover:bg-green-700");
                e.target.classList.add("bg-gray-400");
                showNotification(
                    "Withdrawal processed successfully! Funds will be available in 2-3 business days.",
                    "success"
                );
            }, 2000);
        }
    }

    // Event registration handler
    if (
        e.target.textContent === "Register Now" ||
        e.target.textContent === "Join (₦37,500)" ||
        e.target.textContent === "RSVP"
    ) {
        e.preventDefault();
        const eventCard = e.target.closest(".border");
        const eventTitle = eventCard.querySelector("h4").textContent;
        const eventType = eventCard.querySelector(
            ".bg-blue-100, .bg-green-100, .bg-purple-100"
        ).textContent;

        if (
            eventType === "Premium" &&
            e.target.textContent === "Join (₦37,500)"
        ) {
            if (confirm(`Register for "${eventTitle}" for ₦37,500?`)) {
                e.target.textContent = "Registered";
                e.target.classList.remove("bg-green-600", "hover:bg-green-700");
                e.target.classList.add("bg-blue-600", "cursor-not-allowed");
                e.target.disabled = true;
                showNotification(
                    `Successfully registered for ${eventTitle}!`,
                    "success"
                );
            }
        } else {
            e.target.textContent = "Registered";
            e.target.classList.remove(
                "bg-blue-600",
                "hover:bg-blue-700",
                "bg-purple-600",
                "hover:bg-purple-700"
            );
            e.target.classList.add("bg-green-600", "cursor-not-allowed");
            e.target.disabled = true;
            showNotification(
                `Successfully registered for ${eventTitle}!`,
                "success"
            );
        }
    }

    // Course enrollment handler
    if (
        e.target.textContent === "Start Learning" ||
        e.target.textContent === "Enroll Now"
    ) {
        e.preventDefault();
        const courseCard = e.target.closest(".border");
        const courseTitle = courseCard.querySelector("h4").textContent;
        const coursePrice =
            courseCard.querySelector(".text-green-600").textContent;

        if (
            coursePrice === "₦73,500" &&
            e.target.textContent === "Enroll Now"
        ) {
            if (confirm(`Enroll in "${courseTitle}" for ₦73,500?`)) {
                e.target.textContent = "Enrolled";
                e.target.classList.remove("bg-green-600", "hover:bg-green-700");
                e.target.classList.add("bg-blue-600", "cursor-not-allowed");
                e.target.disabled = true;
                showNotification(
                    `Successfully enrolled in ${courseTitle}!`,
                    "success"
                );
            }
        } else {
            e.target.textContent = "Enrolled";
            e.target.classList.remove("bg-blue-600", "hover:bg-blue-700");
            e.target.classList.add("bg-green-600", "cursor-not-allowed");
            e.target.disabled = true;
            showNotification(
                `Successfully enrolled in ${courseTitle}!`,
                "success"
            );
        }
    }

    // Job request handler
    if (e.target.textContent === "Accept Request") {
        e.preventDefault();
        const requestCard = e.target.closest(".border");
        const clientName = requestCard
            .querySelector("h4")
            .textContent.replace("Request from ", "");
        const budget = requestCard.querySelector(".text-green-600").textContent;

        if (confirm(`Accept job request from ${clientName} (${budget})?`)) {
            e.target.textContent = "Accepted";
            e.target.classList.remove("bg-green-600", "hover:bg-green-700");
            e.target.classList.add("bg-blue-600", "cursor-not-allowed");
            e.target.disabled = true;

            // Update status badge
            const statusBadge = requestCard.querySelector(".bg-orange-100");
            statusBadge.textContent = "Accepted";
            statusBadge.classList.remove("bg-orange-100", "text-orange-800");
            statusBadge.classList.add("bg-green-100", "text-green-800");

            showNotification(
                `Job request accepted! You can now communicate with ${clientName}.`,
                "success"
            );
        }
    }

    // Store selling handler
    if (e.target.textContent === "Start Selling") {
        e.preventDefault();
        const storeCard = e.target.closest(".border");
        const productType = storeCard.querySelector("h4").textContent;

        showNotification(
            `Coming soon! You'll be able to sell ${productType} in our digital store.`,
            "info"
        );
    }

    // Job application handler (for apprentices)
    if (e.target.classList.contains("apply-job-btn")) {
        e.preventDefault();
        const jobId = e.target.dataset.jobId;
        const jobCard = e.target.closest(".border");
        const jobTitle = jobCard.querySelector("h4").textContent;

        // Show application modal
        const proposal = prompt(
            `Please provide a brief proposal for "${jobTitle}":`
        );
        if (proposal && proposal.trim()) {
            handleJobApplication(jobId, proposal);
        }
    }

    // Job creation handler (for members)
    if (e.target.id === "create-job-btn") {
        e.preventDefault();
        handleJobCreation();
    }

    // Application acceptance/rejection handlers (for members)
    if (e.target.classList.contains("accept-app-btn")) {
        e.preventDefault();
        const appId = e.target.dataset.appId;
        handleApplicationAction(appId, "accepted");
    }

    if (e.target.classList.contains("reject-app-btn")) {
        e.preventDefault();
        const appId = e.target.dataset.appId;
        handleApplicationAction(appId, "rejected");
    }

    // Job progress update handler (for apprentices)
    if (e.target.classList.contains("update-progress-btn")) {
        e.preventDefault();
        const jobId = e.target.dataset.jobId;
        const progress = prompt("Enter progress percentage (0-100):");
        if (progress && !isNaN(progress) && progress >= 0 && progress <= 100) {
            handleJobProgressUpdate(jobId, parseInt(progress));
        }
    }

    // Job completion handler (for apprentices)
    if (e.target.classList.contains("complete-job-btn")) {
        e.preventDefault();
        const jobId = e.target.dataset.jobId;
        if (confirm("Are you sure you want to mark this job as completed?")) {
            handleJobCompletion(jobId);
        }
    }

    // Gallery view handler (for viewing apprentice galleries)
    if (e.target.classList.contains("view-gallery-btn")) {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const userName = e.target.dataset.userName;
        handleGalleryView(userId, userName);
    }

    // Quick action handlers for apprentice home page
    if (e.target.textContent === "Update Portfolio") {
        e.preventDefault();
        // Switch to gallery tab
        const galleryTab = document.querySelector('[data-tab="gallery"]');
        if (galleryTab) {
            galleryTab.click();
            showNotification(
                "Switched to Gallery tab. You can now upload new work!",
                "info"
            );
        }
    }

    if (e.target.textContent === "Track Jobs") {
        e.preventDefault();
        // Switch to jobs tab
        const jobsTab = document.querySelector('[data-tab="jobs"]');
        if (jobsTab) {
            jobsTab.click();
            showNotification(
                "Switched to Jobs & Requests tab. Track your job pipeline!",
                "info"
            );
        }
    }

    if (e.target.textContent === "Withdraw Earnings") {
        e.preventDefault();
        // Switch to earnings tab
        const earningsTab = document.querySelector('[data-tab="earnings"]');
        if (earningsTab) {
            earningsTab.click();
            showNotification(
                "Switched to Earnings tab. Manage your finances!",
                "info"
            );
        }
    }

    // Profile update handler
    if (e.target.textContent === "Edit Profile") {
        e.preventDefault();
        const editProfileModal = document.getElementById("edit-profile-modal");
        if (editProfileModal) {
            editProfileModal.classList.add("active");

            // Pre-fill form with current user data
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                const userData = await getUserProfile(user.id);
                const nameInput = document.getElementById("edit-name");
                const creativeTypeInput =
                    document.getElementById("edit-creative-type");
                const descriptionInput =
                    document.getElementById("edit-description");
                const typeLabel = document.getElementById("edit-type-label");

                // Update label based on user role
                if (typeLabel) {
                    typeLabel.textContent =
                        userData.role === "apprentice"
                            ? "Skill"
                            : "Creative Type";
                }

                if (nameInput) nameInput.value = userData.name || "";
                if (creativeTypeInput)
                    creativeTypeInput.value =
                        userData.skill || userData.creative_type || "";
                if (descriptionInput)
                    descriptionInput.value = userData.description || "";
            }
        }
    }
});

function displaySearchResults(results) {
    const searchResultsDiv = document.getElementById("search-results");
    if (!searchResultsDiv) return;

    if (results.length === 0) {
        searchResultsDiv.innerHTML = `
            <h3 class="text-xl font-bold text-gray-900 mb-4">Search Results</h3>
            <div class="text-center py-8">
                <i data-feather="search" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                <p class="text-gray-500">No users found matching your search criteria</p>
            </div>
        `;
    } else {
        searchResultsDiv.innerHTML = `
            <h3 class="text-xl font-bold text-gray-900 mb-4">Search Results (${
                results.length
            })</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${results
                    .map(
                        (user) => `
                    <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div class="flex items-center mb-4">
                            <img src="https://placehold.co/60x60/EBF4FF/3B82F6?text=${
                                user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : "U"
                            }" 
                                 alt="${user.name}" 
                                 class="w-12 h-12 rounded-full mr-4">
                            <div>
                                <h4 class="font-semibold text-gray-900">${
                                    user.name || "Unknown User"
                                }</h4>
                                <p class="text-sm text-gray-600">${
                                    user.creative_type || "Creative"
                                }</p>
                            </div>
                        </div>
                        <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
                            <span>${user.followers || 0} followers</span>
                            <span>${(
                                (user.referral_points || 0) +
                                (user.eligibility_points || 0)
                            ).toLocaleString()} pts</span>
                        </div>
                        <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 follow-btn" 
                                data-user-id="${user.id}">
                            Follow
                        </button>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    searchResultsDiv.classList.remove("hidden");
    if (typeof feather !== "undefined") {
        feather.replace();
    }
}

async function loadTrendingCreators(userData) {
    try {
        console.log("Loading trending creators...");
        const trending = await getTrendingCreators(userData.role || "member");
        const trendingList = document.getElementById("trending-creators-list");

        if (!trendingList) return;

        if (trending.length === 0) {
            trendingList.innerHTML = `
                <div class="p-6 text-center text-gray-500">
                    <i data-feather="users" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                    <p>No trending creators found</p>
                </div>
            `;
        } else {
            trendingList.innerHTML = trending
                .map(
                    (user, index) => `
                <div class="p-4 flex items-center justify-between border-b last:border-b-0 hover:bg-gray-50">
                    <div class="flex items-center">
                        <span class="w-8 h-8 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">
                            ${index + 1}
                        </span>
                        <img src="https://placehold.co/40x40/EBF4FF/3B82F6?text=${
                            user.name ? user.name.charAt(0).toUpperCase() : "U"
                        }" 
                             alt="${user.name}" 
                             class="w-10 h-10 rounded-full mr-3">
                        <div>
                            <p class="font-semibold text-gray-900">${
                                user.name || "Unknown User"
                            }</p>
                            <p class="text-sm text-gray-600">${
                                user.role === "apprentice"
                                    ? user.skill || "Apprentice"
                                    : user.creative_type || "Creative"
                            }</p>
                            ${
                                user.location
                                    ? `<p class="text-xs text-gray-500">${user.location}</p>`
                                    : ""
                            }
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-right text-sm">
                            <p class="font-semibold">${
                                user.followers || 0
                            } followers</p>
                            ${
                                user.role === "member"
                                    ? `
                                <p class="text-gray-500">${(
                                    (user.referral_points || 0) +
                                    (user.eligibility_points || 0)
                                ).toLocaleString()} pts</p>
                            `
                                    : ""
                            }
                        </div>
                        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 follow-btn text-sm" 
                                data-user-id="${user.id}">
                            ${
                                userData.role === "member" &&
                                user.role === "apprentice"
                                    ? "Connect"
                                    : "Follow"
                            }
                        </button>
                    </div>
                </div>
            `
                )
                .join("");
        }

        if (typeof feather !== "undefined") {
            feather.replace();
        }
    } catch (error) {
        console.error("Error loading trending creators:", error);
        const trendingList = document.getElementById("trending-creators-list");
        if (trendingList) {
            trendingList.innerHTML = `
                <div class="p-6 text-center text-red-500">
                    <p>Error loading trending creators</p>
                </div>
            `;
        }
    }
}

// --- Edit Profile ---
async function handleProfileUpdate(e, userData) {
    e.preventDefault();
    const newName = document.getElementById("edit-name").value;
    const newCreativeType = document.getElementById("edit-creative-type").value;
    const newDescription = document.getElementById("edit-description").value;

    const spinner = document.getElementById("edit-spinner");
    const submitBtn = document.getElementById("submit-edit-profile");

    if (spinner) spinner.classList.remove("hidden");
    if (submitBtn) submitBtn.disabled = true;

    try {
        const dataToUpdate = { name: newName, description: newDescription };
        if (userData.role === "member") {
            dataToUpdate.creative_type = newCreativeType;
        } else if (userData.role === "apprentice") {
            dataToUpdate.skill = newCreativeType; // For apprentices, creative-type field is used for skill
        }

        await updateUserProfile(userData.id, dataToUpdate);

        // Update userData object
        userData.name = newName;
        userData.description = newDescription;
        if (userData.role === "member") {
            userData.creative_type = newCreativeType;
        } else if (userData.role === "apprentice") {
            userData.skill = newCreativeType;
        }

        // Update UI elements immediately
        userNameEl.textContent = userData.name;
        const activeTab = userData.role === "member" ? "profile" : "settings";
        await switchContent(activeTab, userData);

        editProfileModal.classList.remove("active");
        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
    } finally {
        if (spinner) spinner.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = false;
    }
}

// --- Delete Post ---
async function handlePostDelete(postId, userData) {
    try {
        const spinner = document.getElementById("delete-spinner");
        const confirmBtn = document.getElementById("confirm-delete-post");

        if (spinner) spinner.classList.remove("hidden");
        if (confirmBtn) confirmBtn.disabled = true;

        await deletePost(postId, userData.id);

        // Close modal
        deletePostModal.classList.remove("active");

        // Show success message
        showNotification("Post deleted successfully!", "success");

        // Refresh gallery
        await refreshGallery(userData);
    } catch (error) {
        console.error("Error deleting post:", error);

        let errorMessage = "Failed to delete post. Please try again.";
        if (error.message.includes("own posts")) {
            errorMessage = "You can only delete your own posts.";
        }

        showNotification(errorMessage, "error");
    } finally {
        const spinner = document.getElementById("delete-spinner");
        const confirmBtn = document.getElementById("confirm-delete-post");

        if (spinner) spinner.classList.add("hidden");
        if (confirmBtn) confirmBtn.disabled = false;
    }
}

// --- Upload Work ---
async function handleWorkUpload(e, userData) {
    e.preventDefault();
    const title = document.getElementById("upload-title").value;
    const description = document.getElementById("upload-description").value;
    const file = document.getElementById("upload-file").files[0];

    if (!file) {
        alert("Please select an image to upload.");
        return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
        alert("Please select an image file (JPEG, PNG, GIF, etc.).");
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.");
        return;
    }

    const spinner = document.getElementById("upload-spinner");
    const submitBtn = document.getElementById("submit-upload");

    spinner.classList.remove("hidden");
    submitBtn.disabled = true;

    try {
        console.log("Starting upload process...");
        console.log("File details:", {
            name: file.name,
            size: file.size,
            type: file.type,
        });

        // Check storage bucket accessibility first
        console.log("🔍 Checking storage bucket accessibility...");
        const bucketAccessible = await checkStorageBucket("posts");
        console.log("📊 Bucket accessibility result:", bucketAccessible);

        if (!bucketAccessible) {
            throw new Error(
                "Storage bucket 'posts' is not accessible. Please check your Supabase storage configuration and policies."
            );
        }
        console.log("✅ Storage bucket is accessible");

        // 1. Upload image to Supabase Storage
        const filePath = `posts/${userData.id}/${Date.now()}_${file.name}`;
        console.log("Uploading file to path:", filePath);

        // Use the improved upload function that doesn't try to create buckets
        const { data, error } = await supabase.storage
            .from("posts")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Upload error:", error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }

        console.log("File uploaded successfully:", data);

        // 2. Get the public URL for the uploaded file
        const imageUrl = getFileUrl("posts", filePath);
        console.log("Generated image URL:", imageUrl);
        console.log("Image URL type:", typeof imageUrl);
        console.log("Image URL value:", imageUrl);

        // Validate the URL format
        if (!imageUrl || !imageUrl.startsWith("http")) {
            throw new Error("Invalid image URL generated");
        }

        // Test if the image URL is accessible
        try {
            const imgTest = new Image();
            imgTest.onload = () => console.log("Image URL is accessible");
            imgTest.onerror = () =>
                console.warn("Image URL might not be accessible yet");
            imgTest.src = imageUrl;
        } catch (imgError) {
            console.warn("Could not test image URL:", imgError);
        }

        // 3. Add post data to Supabase
        await addPost(userData.id, title, description, imageUrl);

        // 4. Award points for uploading
        await incrementUserPoints(userData.id, "eligibility_points", 50);
        userData.eligibility_points = (userData.eligibility_points || 0) + 50; // Update local user data

        // 5. Reset form and close modal
        uploadWorkForm.reset();
        uploadModal.classList.remove("active");

        // Show success message
        showNotification(
            "Your work has been uploaded successfully!",
            "success"
        );

        // 6. Refresh gallery view
        await refreshGallery(userData);
    } catch (error) {
        console.error("Error uploading work:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
        });

        let errorMessage =
            "An error occurred while uploading. Please try again.";

        if (error.message.includes("bucket")) {
            errorMessage =
                "Storage issue detected. Please try again in a moment.";
        } else if (error.message.includes("permission")) {
            errorMessage =
                "Permission denied. Please check your account status.";
        } else if (error.message.includes("network")) {
            errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("Invalid image URL")) {
            errorMessage = "Failed to generate image URL. Please try again.";
        } else if (error.message.includes("Failed to upload file")) {
            errorMessage =
                "File upload failed. Please check your file and try again.";
        }

        // Show detailed error in console and notification
        console.error("User-friendly error message:", errorMessage);
        showNotification(errorMessage, "error");
    } finally {
        spinner.classList.add("hidden");
        submitBtn.disabled = false;
    }
}

// --- Image Viewer Functions ---
function setupImageViewer() {
    // Handle view image button clicks
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("view-image-btn")) {
            const imageUrl = e.target.dataset.imageUrl;
            const title = e.target.dataset.title;
            openImageViewer(imageUrl, title);
        }

        if (e.target.closest("#close-image-viewer")) {
            closeImageViewer();
        }
    });

    // Close image viewer with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeImageViewer();
        }
    });
}

function openImageViewer(imageUrl, title, description = "") {
    const modal = document.getElementById("image-viewer-modal");
    const image = document.getElementById("viewer-image");
    const titleEl = document.getElementById("viewer-title");

    if (modal && image && titleEl) {
        image.src = imageUrl;
        titleEl.textContent = title;

        // Add description if provided
        if (description) {
            const descriptionEl = document.getElementById("viewer-description");
            if (descriptionEl) {
                descriptionEl.textContent = description;
                descriptionEl.style.display = "block";
            }
        }

        modal.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
    }
}

function closeImageViewer() {
    const modal = document.getElementById("image-viewer-modal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = ""; // Restore scrolling
    }
}

// --- Notification System ---
function showNotification(message, type = "info") {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById(
        "notification-container"
    );
    if (!notificationContainer) {
        notificationContainer = document.createElement("div");
        notificationContainer.id = "notification-container";
        notificationContainer.className = "fixed top-4 right-4 z-50 space-y-2";
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification bg-white border-l-4 p-4 shadow-lg rounded-r-lg max-w-sm transform transition-all duration-300 translate-x-full`;

    // Set border color based on type
    const borderColors = {
        success: "border-green-500",
        error: "border-red-500",
        warning: "border-yellow-500",
        info: "border-blue-500",
    };
    notification.classList.add(borderColors[type] || borderColors.info);

    // Set icon and text color based on type
    const iconColors = {
        success: "text-green-500",
        error: "text-red-500",
        warning: "text-yellow-500",
        info: "text-blue-500",
    };
    const textColors = {
        success: "text-green-700",
        error: "text-red-700",
        warning: "text-yellow-700",
        info: "text-blue-700",
    };

    const icons = {
        success: "check-circle",
        error: "alert-circle",
        warning: "alert-triangle",
        info: "info",
    };

    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <i data-feather="${icons[type] || icons.info}" class="w-5 h-5 ${
        iconColors[type] || iconColors.info
    }"></i>
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium ${
                    textColors[type] || textColors.info
                }">${message}</p>
            </div>
            <div class="ml-auto pl-3">
                <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i data-feather="x" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `;

    // Add to container
    notificationContainer.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove("translate-x-full");
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add("translate-x-full");
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);

    // Replace feather icons
    if (typeof feather !== "undefined") {
        feather.replace();
    }
}

// --- Event Listeners Setup ---
function setupEventListeners(userData) {
    console.log("Setting up event listeners");

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    }

    // Navigation
    if (mainNav) {
        mainNav.addEventListener("click", async (e) => {
            const tabButton = e.target.closest("[data-tab]");
            if (tabButton && !tabButton.disabled) {
                const tabId = tabButton.dataset.tab;
                await switchContent(tabId, userData);
            }
        });
    }

    // Modals
    if (editProfileModal) {
        const cancelBtn = editProfileModal.querySelector(
            "#cancel-edit-profile"
        );
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                editProfileModal.classList.remove("active");
            });
        }
    }

    if (uploadModal) {
        const cancelBtn = uploadModal.querySelector("#cancel-upload");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                uploadModal.classList.remove("active");
            });
        }
    }

    if (deletePostModal) {
        const cancelBtn = deletePostModal.querySelector("#cancel-delete-post");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                deletePostModal.classList.remove("active");
            });
        }
    }

    // Forms
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", (e) =>
            handleProfileUpdate(e, userData)
        );
    }

    if (
        uploadWorkForm &&
        (userData.role === "member" || userData.role === "apprentice")
    ) {
        uploadWorkForm.addEventListener("submit", (e) =>
            handleWorkUpload(e, userData)
        );
    }
}

// --- Main Render Function ---
async function renderDashboard(user, userData) {
    try {
        console.log("Rendering dashboard for user:", userData);

        // Universal header setup
        userNameEl.textContent = userData.name || "No Name";
        const initials = (userData.name || "U").charAt(0).toUpperCase();
        userAvatarEl.src = `https://placehold.co/100x100/EBF4FF/3B82F6?text=${initials}`;

        // Role-based rendering
        if (userData.role === "apprentice") {
            userRoleInfoEl.textContent = "Apprentice";
            renderNavigation(apprenticeTabs);
            await switchContent("home", userData);
        } else {
            // Default to member
            userRoleInfoEl.textContent = `${
                subscriptionPlans[userData.subscription_plan || "free"].name
            } Plan`;
            renderNavigation(memberTabs, userData.subscription_plan || "free");
            await switchContent("home", userData);
        }

        loadingScreen.classList.add("hidden");
        dashboardLayout.classList.remove("hidden");
        setupEventListeners(userData);
        setupImageViewer(); // Initialize image viewer

        console.log("Dashboard rendered successfully");
    } catch (error) {
        console.error("Error rendering dashboard:", error);
        loadingScreen.classList.add("hidden");
        dashboardLayout.classList.remove("hidden");
        mainContent.innerHTML =
            '<div class="text-center py-12"><p class="text-red-500">Error loading dashboard. Please refresh the page.</p></div>';
    }
}

// --- Navigation & Content Switching ---
function renderNavigation(tabs, planKey = "free") {
    const userPlan = subscriptionPlans[planKey];
    const navItems = tabs
        .map((tab) => {
            // For members, check subscription access. For apprentices, all tabs are unlocked.
            const isUnlocked =
                tabs === apprenticeTabs ||
                userPlan.unlocks.includes("*") ||
                userPlan.unlocks.includes(tab.id) ||
                tab.access === "free";
            return `
            <button class="nav-link flex items-center px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-800 ${
                !isUnlocked ? "opacity-50 cursor-not-allowed" : ""
            }" 
                    data-tab="${tab.id}" ${!isUnlocked ? "disabled" : ""}>
                <i data-feather="${tab.icon}" class="w-4 h-4 mr-2"></i>
                ${tab.name}
                ${
                    !isUnlocked
                        ? '<i data-feather="lock" class="w-3 h-3 ml-1"></i>'
                        : ""
                }
            </button>
        `;
        })
        .join("");
    mainNav.innerHTML = navItems;

    // Set initial active tab
    const firstTab = mainNav.querySelector('[data-tab="home"]');
    if (firstTab) {
        firstTab.classList.add("active");
        currentActiveTab = "home";
    }

    // Replace feather icons in navigation
    if (typeof feather !== "undefined") {
        feather.replace();
    }
}

async function switchContent(tabId, userData) {
    try {
        console.log("Switching to tab:", tabId);

        // Update active nav
        mainNav.querySelectorAll(".nav-link").forEach((link) => {
            link.classList.remove("active");
            if (link.dataset.tab === tabId) {
                link.classList.add("active");
                currentActiveTab = tabId;
            }
        });

        let content = "";
        const templates =
            userData.role === "apprentice"
                ? apprenticeContentTemplates
                : memberContentTemplates;

        // Special cases for data fetching
        if (userData.role === "member" && tabId === "explore") {
            try {
                const recommendations = await fetchRecommendations(userData);
                content = templates.explore(userData, recommendations, []);
            } catch (error) {
                console.error("Error loading explore content:", error);
                content = templates.explore(userData, [], []);
            }
        } else if (
            (userData.role === "member" || userData.role === "apprentice") &&
            tabId === "gallery"
        ) {
            try {
                const posts = await getUserPosts(userData.id);
                content = templates.gallery(userData, posts);
            } catch (error) {
                console.error("Error loading gallery:", error);
                content = templates.gallery(userData, []);
            }
        } else if (userData.role === "member" && tabId === "leaderboard") {
            try {
                const topUsers = await getTopUsers();
                content = templates.leaderboard(userData, topUsers);
            } catch (error) {
                console.error("Error loading leaderboard:", error);
                content = templates.leaderboard(userData, []);
            }
        } else if (
            userData.role === "apprentice" &&
            (tabId === "home" || tabId === "jobs" || tabId === "earnings")
        ) {
            // Handle async apprentice templates
            try {
                content = await templates[tabId](userData);
            } catch (error) {
                console.error(`Error loading ${tabId} content:`, error);
                content = `<div class="text-center py-12"><p class="text-red-500">Error loading content. Please try again.</p></div>`;
            }
        } else if (userData.role === "member" && tabId === "jobs") {
            // Handle async member jobs template
            try {
                content = await templates[tabId](userData);
            } catch (error) {
                console.error("Error loading jobs content:", error);
                content = `<div class="text-center py-12"><p class="text-red-500">Error loading jobs. Please try again.</p></div>`;
            }
        } else if (userData.role === "member" && tabId === "earnings") {
            // Handle async member earnings template
            try {
                content = await templates[tabId](userData);
            } catch (error) {
                console.error("Error loading earnings content:", error);
                content = `<div class="text-center py-12"><p class="text-red-500">Error loading earnings. Please try again.</p></div>`;
            }
        } else {
            // Default content rendering
            const template = templates[tabId];
            if (template) {
                if (typeof template === "function") {
                    content = template(userData);
                } else {
                    content = template;
                }
            } else {
                content = `<div class="text-center py-12"><p class="text-gray-500">Content not available.</p></div>`;
            }
        }

        // Update main content
        mainContent.innerHTML = content;

        // Load trending creators for explore tab
        if (userData.role === "member" && tabId === "explore") {
            await loadTrendingCreators(userData);
        }

        // Attach dynamic event listeners
        attachDynamicEventListeners(tabId, userData);

        // Gallery-specific enhancements
        if (tabId === "gallery") {
            setupGalleryImageHandling();
            enhanceGalleryDisplay();
            setupGalleryDeleteButtons(userData);

            // Add upload modal listener for apprentices
            if (userData.role === "apprentice") {
                console.log("Setting up upload modal for apprentice...");
                const openUploadModalBtn =
                    document.getElementById("open-upload-modal");
                const galleryUploadBtn =
                    document.getElementById("gallery-upload-btn");

                console.log("Upload modal elements:", {
                    openUploadModalBtn: !!openUploadModalBtn,
                    galleryUploadBtn: !!galleryUploadBtn,
                    uploadModal: !!uploadModal,
                });

                if (openUploadModalBtn) {
                    openUploadModalBtn.addEventListener("click", () => {
                        console.log("Opening upload modal for apprentice");
                        uploadModal.classList.add("active");
                    });
                }
                if (galleryUploadBtn) {
                    galleryUploadBtn.addEventListener("click", () => {
                        console.log("Opening upload modal from gallery button");
                        uploadModal.classList.add("active");
                    });
                }
            }
        }

        // Replace feather icons
        if (typeof feather !== "undefined") {
            feather.replace();
        }

        console.log("Content switched to:", tabId);
    } catch (error) {
        console.error("Error switching content:", error);
        mainContent.innerHTML =
            '<div class="text-center py-12"><p class="text-red-500">Error loading content. Please try again.</p></div>';
    }
}

// --- Utility Functions ---
function copyToClipboard(text) {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            showNotification("Referral link copied to clipboard!", "success");
        })
        .catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            showNotification("Referral link copied to clipboard!", "success");
        });
}

// --- Main Initialization ---
async function initializeDashboard() {
    try {
        console.log("Initializing dashboard...");

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log("No authenticated user, redirecting to login");
            window.location.href = "login-supabase.html";
            return;
        }

        console.log("User authenticated:", user.id);

        // Get user profile
        const userData = await getUserProfile(user.id);
        console.log("User profile loaded:", userData);

        // Render dashboard
        await renderDashboard(user, userData);

        // Start real-time updates for apprentices
        if (userData.role === "apprentice") {
            startRealTimeUpdates(userData);
            await updateApprenticeStats(userData); // Initial stats update
        }
    } catch (error) {
        console.error("Dashboard initialization error:", error);

        // Check if it's an auth error
        if (error.message.includes("JWT") || error.message.includes("auth")) {
            console.log("Authentication error, redirecting to login");
            window.location.href = "login-supabase.html";
            return;
        }

        // Show error in UI
        loadingScreen.classList.add("hidden");
        dashboardLayout.classList.remove("hidden");
        mainContent.innerHTML = `
            <div class="text-center py-12">
                <p class="text-red-500 mb-4">Error loading dashboard: ${error.message}</p>
                <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        `;
    }
}

// --- User Profile Modal Functions ---
async function showUserProfileModal(userId, userName) {
    try {
        // Get user profile data
        const { data: userProfile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error fetching user profile:", error);
            showNotification("Error loading user profile", "error");
            return;
        }

        // Update modal content
        const modal = document.getElementById("user-profile-modal");
        const avatar = document.getElementById("modal-user-avatar");
        const name = document.getElementById("modal-user-name");
        const role = document.getElementById("modal-user-role");
        const location = document.getElementById("modal-user-location");
        const descriptionContent = document.getElementById(
            "modal-description-content"
        );
        const connectBtn = document.getElementById("modal-connect-btn");
        const galleryBtn = document.getElementById("modal-view-gallery-btn");

        // Set user info
        const initials = (userProfile.name || "U").charAt(0).toUpperCase();
        avatar.src = `https://placehold.co/100x100/EBF4FF/3B82F6?text=${initials}`;
        avatar.alt = userProfile.name;
        name.textContent = userProfile.name || "Unknown User";
        role.textContent =
            userProfile.role === "apprentice" ? "Apprentice" : "Member";
        location.textContent = userProfile.location || "Location not set";

        // Set description
        if (userProfile.description && userProfile.description.trim()) {
            descriptionContent.innerHTML = `<p class="text-gray-700 text-sm">${userProfile.description}</p>`;
        } else {
            descriptionContent.innerHTML = `<p class="text-gray-500 text-sm italic">No description available.</p>`;
        }

        // Set button data attributes
        connectBtn.dataset.userId = userId;
        connectBtn.dataset.userName = userProfile.name;
        galleryBtn.dataset.userId = userId;
        galleryBtn.dataset.userName = userProfile.name;

        // Show modal
        modal.classList.add("active");

        // Replace feather icons
        if (typeof feather !== "undefined") {
            feather.replace();
        }
    } catch (error) {
        console.error("Error showing user profile modal:", error);
        showNotification("Error loading user profile", "error");
    }
}

// --- Event Listeners for Modals ---
document.addEventListener("DOMContentLoaded", () => {
    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            e.target.classList.remove("active");
        }
    });

    // User Profile Modal Event Handlers
    const userProfileModal = document.getElementById("user-profile-modal");
    if (userProfileModal) {
        const closeBtn = userProfileModal.querySelector(
            "#close-user-profile-modal"
        );
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                userProfileModal.classList.remove("active");
            });
        }

        // Connect button handler
        const connectBtn = userProfileModal.querySelector("#modal-connect-btn");
        if (connectBtn) {
            connectBtn.addEventListener("click", async () => {
                const userId = connectBtn.dataset.userId;
                const userName = connectBtn.dataset.userName;

                // Get current user
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) {
                    showNotification(
                        "Please log in to connect with users",
                        "error"
                    );
                    return;
                }

                if (user.id === userId) {
                    showNotification(
                        "You cannot connect with yourself",
                        "error"
                    );
                    return;
                }

                try {
                    connectBtn.disabled = true;
                    connectBtn.textContent = "Connecting...";

                    const success = await followUser(user.id, userId);

                    if (success) {
                        connectBtn.textContent = "Connected!";
                        connectBtn.classList.remove(
                            "bg-blue-600",
                            "hover:bg-blue-700"
                        );
                        connectBtn.classList.add(
                            "bg-green-600",
                            "cursor-not-allowed"
                        );
                        connectBtn.disabled = true;

                        // Update the original follow button if it exists
                        const originalBtn = document.querySelector(
                            `[data-user-id="${userId}"].follow-btn`
                        );
                        if (originalBtn) {
                            originalBtn.textContent = "Following";
                            originalBtn.classList.remove(
                                "bg-blue-600",
                                "hover:bg-blue-700"
                            );
                            originalBtn.classList.add(
                                "bg-gray-400",
                                "cursor-not-allowed"
                            );
                            originalBtn.disabled = true;
                        }

                        // Update follower count in UI
                        updateFollowerCountInUI(userId);

                        showNotification(
                            `Successfully connected with ${userName}!`,
                            "success"
                        );

                        // Close modal after 2 seconds
                        setTimeout(() => {
                            userProfileModal.classList.remove("active");
                        }, 2000);
                    } else {
                        throw new Error("Failed to connect");
                    }
                } catch (error) {
                    console.error("Error connecting with user:", error);
                    connectBtn.disabled = false;
                    connectBtn.textContent = "Connect";
                    showNotification(
                        "Error connecting with user. Please try again.",
                        "error"
                    );
                }
            });
        }

        // View Gallery button handler
        const galleryBtn = userProfileModal.querySelector(
            "#modal-view-gallery-btn"
        );
        if (galleryBtn) {
            galleryBtn.addEventListener("click", () => {
                const userId = galleryBtn.dataset.userId;
                const userName = galleryBtn.dataset.userName;

                // Close user profile modal
                userProfileModal.classList.remove("active");

                // Show gallery modal
                handleGalleryView(userId, userName);
            });
        }
    }

    // Close modals with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal.active").forEach((modal) => {
                modal.classList.remove("active");
            });
        }
    });

    // Initialize dashboard
    initializeDashboard();
});

// --- Gallery Delete Button Setup ---
function setupGalleryDeleteButtons(userData) {
    // Add event listeners to all delete buttons
    document.addEventListener("click", (e) => {
        if (e.target.closest(".delete-post-btn")) {
            e.preventDefault();
            e.stopPropagation();

            const deleteBtn = e.target.closest(".delete-post-btn");
            const postId = deleteBtn.dataset.postId;
            const postTitle = deleteBtn.dataset.postTitle;

            // Show delete confirmation modal
            const titleSpan = document.getElementById("delete-post-title");
            if (titleSpan) titleSpan.textContent = postTitle;

            deletePostModal.classList.add("active");

            // Store post ID for deletion
            deletePostModal.dataset.postId = postId;
        }
    });

    // Handle delete confirmation
    const confirmDeleteBtn = document.getElementById("confirm-delete-post");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            const postId = deletePostModal.dataset.postId;
            if (postId) {
                await handlePostDelete(postId, userData);
            }
        });
    }
}

// --- Gallery Image Handling ---
function setupGalleryImageHandling() {
    // Handle image loading states
    document.addEventListener("DOMContentLoaded", () => {
        const images = document.querySelectorAll(".gallery-image");
        images.forEach((img) => {
            img.classList.add("image-loading");

            img.onload = function () {
                this.classList.remove("image-loading");
                this.classList.add("image-loaded");
            };

            img.onerror = function () {
                this.classList.remove("image-loading");
                this.src =
                    "https://placehold.co/400x300/EBF4FF/3B82F6?text=Image+Not+Found";
                this.classList.add("opacity-50");
            };
        });
    });
}

// --- Enhanced Gallery Display ---
function enhanceGalleryDisplay() {
    // Add lazy loading for images
    const images = document.querySelectorAll(".gallery-image");
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove("lazy");
                observer.unobserve(img);
            }
        });
    });

    images.forEach((img) => {
        if (img.classList.contains("lazy")) {
            imageObserver.observe(img);
        }
    });
}

// --- Refresh Gallery Display ---
async function refreshGallery(userData) {
    try {
        const posts = await getUserPosts(userData.id);
        const galleryContent = memberContentTemplates.gallery(userData, posts);

        // Update the gallery content
        mainContent.innerHTML = galleryContent;

        // Re-setup gallery functionality
        setupGalleryImageHandling();
        enhanceGalleryDisplay();
        await enhanceGalleryDisplayWithUrlTesting(); // Test image URLs
        attachDynamicEventListeners("gallery", userData);

        // Replace feather icons
        if (typeof feather !== "undefined") {
            feather.replace();
        }

        console.log("Gallery refreshed with", posts.length, "posts");
    } catch (error) {
        console.error("Error refreshing gallery:", error);
        showNotification("Error refreshing gallery", "error");
    }
}

// --- Test Image URL Accessibility ---
async function testImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;

        // Timeout after 10 seconds
        setTimeout(() => resolve(false), 10000);
    });
}

// --- Enhanced Gallery Display with URL Testing ---
async function enhanceGalleryDisplayWithUrlTesting() {
    const images = document.querySelectorAll(".gallery-image");

    for (const img of images) {
        const originalSrc = img.src;

        // Test if the image URL is accessible
        const isAccessible = await testImageUrl(originalSrc);

        if (!isAccessible) {
            console.warn(`Image URL not accessible: ${originalSrc}`);
            img.src =
                "https://placehold.co/400x300/EBF4FF/3B82F6?text=Image+Loading...";
            img.classList.add("opacity-50");

            // Try to refresh the image after a delay
            setTimeout(async () => {
                const retryAccessible = await testImageUrl(originalSrc);
                if (retryAccessible) {
                    img.src = originalSrc;
                    img.classList.remove("opacity-50");
                    console.log(`Image URL now accessible: ${originalSrc}`);
                }
            }, 2000);
        }
    }
}

// --- Storage Diagnostics ---
async function testStorageConfiguration() {
    try {
        console.log("Testing storage configuration...");

        // Test bucket listing
        const { data: buckets, error: listError } =
            await supabase.storage.listBuckets();
        if (listError) {
            console.error("❌ Cannot list buckets:", listError);
            return false;
        }

        console.log(
            "✅ Available buckets:",
            buckets.map((b) => b.name)
        );

        // Check if posts bucket exists
        const postsBucket = buckets.find((b) => b.name === "posts");
        if (!postsBucket) {
            console.log("⚠️ 'posts' bucket doesn't exist");

            // Try to create it
            const { error: createError } = await supabase.storage.createBucket(
                "posts",
                {
                    public: true,
                    allowedMimeTypes: ["image/*"],
                    fileSizeLimit: 5242880,
                }
            );

            if (createError) {
                console.error("❌ Cannot create posts bucket:", createError);
                return false;
            }

            console.log("✅ Created posts bucket successfully");
        } else {
            console.log("✅ posts bucket exists");
        }

        // Test bucket access
        const bucketAccessible = await checkStorageBucket("posts");
        if (bucketAccessible) {
            console.log("✅ posts bucket is accessible");
        } else {
            console.error("❌ posts bucket is not accessible");
            return false;
        }

        return true;
    } catch (error) {
        console.error("❌ Storage test failed:", error);
        return false;
    }
}

// Export functions for testing/debugging
export {
    renderDashboard,
    switchContent,
    fetchRecommendations,
    loadTrendingCreators,
    handleProfileUpdate,
    handleWorkUpload,
    handlePostDelete,
    togglePostLike,
    checkUserLike,
};

// --- Apprentice Dashboard Stats Management ---
async function updateApprenticeStats(userData) {
    try {
        // Get real stats from database
        const realStats = await getApprenticeStats(userData.id);

        // Use real data for job statistics
        const stats = {
            pendingJobs: realStats.pendingJobs || 0,
            activeJobs: realStats.activeJobs || 0,
            completedJobs: realStats.completedJobs || 0,
            totalEarned: realStats.totalEarned || 0,
            // Keep some placeholder values for features not yet implemented
            availableBalance: Math.floor(Math.random() * 3000000) + 750000, // ₦750,000-₦3,750,000 available
            thisMonth: Math.floor(Math.random() * 1500000) + 300000, // ₦300,000-₦1,800,000 this month
            goalProgress: Math.floor(Math.random() * 40) + 60, // 60-100% goal progress
        };

        // Update stats in the UI
        const statElements = document.querySelectorAll(".stat-card p.text-3xl");
        if (statElements.length >= 3) {
            statElements[0].textContent = stats.pendingJobs;
            statElements[1].textContent = stats.activeJobs;
            statElements[2].textContent = stats.completedJobs;
        }

        // Update earnings stats if on earnings page
        const earningsStats = document.querySelectorAll(
            ".stat-card p.text-3xl"
        );
        if (earningsStats.length >= 4) {
            earningsStats[0].textContent = `₦${(
                stats.totalEarned * 1500
            ).toLocaleString()}`;
            earningsStats[1].textContent = `₦${(
                stats.availableBalance * 1500
            ).toLocaleString()}`;
            earningsStats[2].textContent = `₦${(
                stats.thisMonth * 1500
            ).toLocaleString()}`;
            earningsStats[3].textContent = `${stats.goalProgress}%`;
        }

        return stats;
    } catch (error) {
        console.error("Error updating apprentice stats:", error);
        // Return default values if there's an error
        return {
            pendingJobs: 0,
            activeJobs: 0,
            completedJobs: 0,
            totalEarned: 0,
            availableBalance: 0,
            thisMonth: 0,
            goalProgress: 0,
        };
    }
}

// --- Real-time Updates ---
function startRealTimeUpdates(userData) {
    // Update stats every 30 seconds to simulate real-time data
    setInterval(async () => {
        if (
            currentActiveTab === "home" ||
            currentActiveTab === "jobs" ||
            currentActiveTab === "earnings"
        ) {
            await updateApprenticeStats(userData);
        }
    }, 30000);

    // Simulate new job notifications
    setInterval(() => {
        if (Math.random() < 0.1) {
            // 10% chance every 2 minutes
            const jobTitles = [
                "Logo Design for Startup",
                "Product Photography",
                "Website Development",
                "Social Media Graphics",
                "Brand Identity Design",
            ];
            const randomJob =
                jobTitles[Math.floor(Math.random() * jobTitles.length)];
            showNotification(`New job available: ${randomJob}`, "info");
        }
    }, 120000);
}

// --- Job System Handler Functions ---

// Handle job application
async function handleJobApplication(jobId, proposal) {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            showNotification("Please log in to apply for jobs", "error");
            return;
        }

        await applyForJob(user.id, jobId, proposal);
        showNotification("Job application submitted successfully!", "success");

        // Refresh the jobs tab
        const jobsTab = document.querySelector('[data-tab="jobs"]');
        if (jobsTab) {
            jobsTab.click();
        }
    } catch (error) {
        console.error("Error applying for job:", error);
        showNotification(error.message || "Failed to apply for job", "error");
    }
}

// Handle job creation
async function handleJobCreation() {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            showNotification("Please log in to create jobs", "error");
            return;
        }

        const form = document.getElementById("create-job-form");
        const formData = new FormData(form);

        const jobData = {
            title: formData.get("title"),
            description: formData.get("description"),
            budgetMin: parseInt(formData.get("budgetMin")),
            budgetMax: parseInt(formData.get("budgetMax")),
            location: formData.get("location") || "Remote",
            deadline: formData.get("deadline"),
            skillsRequired: Array.from(
                form.querySelector("#job-skills").selectedOptions
            ).map((option) => option.value),
        };

        // Validate form data
        if (
            !jobData.title ||
            !jobData.description ||
            !jobData.budgetMin ||
            !jobData.budgetMax ||
            !jobData.deadline
        ) {
            showNotification("Please fill in all required fields", "error");
            return;
        }

        if (jobData.budgetMin > jobData.budgetMax) {
            showNotification(
                "Minimum budget cannot be greater than maximum budget",
                "error"
            );
            return;
        }

        await createJobRequest(user.id, jobData);
        showNotification("Job request created successfully!", "success");

        // Reset form
        form.reset();

        // Refresh the jobs tab
        const jobsTab = document.querySelector('[data-tab="jobs"]');
        if (jobsTab) {
            jobsTab.click();
        }
    } catch (error) {
        console.error("Error creating job:", error);
        showNotification(
            error.message || "Failed to create job request",
            "error"
        );
    }
}

// Handle application action (accept/reject)
async function handleApplicationAction(appId, action) {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            showNotification("Please log in to manage applications", "error");
            return;
        }

        await updateApplicationStatus(appId, action, user.id);
        showNotification(`Application ${action} successfully!`, "success");

        // Refresh the jobs tab
        const jobsTab = document.querySelector('[data-tab="jobs"]');
        if (jobsTab) {
            jobsTab.click();
        }
    } catch (error) {
        console.error("Error updating application:", error);
        showNotification(
            error.message || "Failed to update application",
            "error"
        );
    }
}

// Handle job progress update
async function handleJobProgressUpdate(jobId, progress) {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            showNotification("Please log in to update job progress", "error");
            return;
        }

        await updateJobProgress(jobId, progress, user.id);
        showNotification(`Job progress updated to ${progress}%`, "success");

        // Refresh the jobs tab
        const jobsTab = document.querySelector('[data-tab="jobs"]');
        if (jobsTab) {
            jobsTab.click();
        }
    } catch (error) {
        console.error("Error updating job progress:", error);
        showNotification(
            error.message || "Failed to update job progress",
            "error"
        );
    }
}

// Handle job completion
async function handleJobCompletion(jobId) {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            showNotification("Please log in to complete jobs", "error");
            return;
        }

        const result = await completeJob(jobId, user.id);
        showNotification(
            `Job completed! You earned ₦${(
                result.payment * 1500
            ).toLocaleString()}`,
            "success"
        );

        // Refresh the jobs tab
        const jobsTab = document.querySelector('[data-tab="jobs"]');
        if (jobsTab) {
            jobsTab.click();
        }
    } catch (error) {
        console.error("Error completing job:", error);
        showNotification(error.message || "Failed to complete job", "error");
    }
}

// Handle gallery view for viewing apprentice galleries
async function handleGalleryView(userId, userName) {
    try {
        // Get current user for like functionality
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const currentUserId = user ? user.id : null;

        // Get user profile for additional info
        const userProfile = await getUserProfile(userId);

        // Show modal and loading state
        const galleryModal = document.getElementById("gallery-view-modal");
        const galleryContent = document.getElementById("gallery-content");
        const galleryLoading = document.getElementById("gallery-loading");
        const galleryEmpty = document.getElementById("gallery-empty");
        const galleryUserName = document.getElementById("gallery-user-name");
        const galleryUserInfo = document.getElementById("gallery-user-info");
        const galleryUserAvatar = document.getElementById(
            "gallery-user-avatar"
        );

        // Set user info
        galleryUserName.textContent = userName;
        galleryUserInfo.textContent = `${userProfile.skill || "Apprentice"} • ${
            userProfile.location || "Unknown location"
        }`;
        galleryUserAvatar.src = `https://placehold.co/48x48/EBF4FF/3B82F6?text=${userName
            .charAt(0)
            .toUpperCase()}`;
        galleryUserAvatar.alt = userName;

        // Show modal
        galleryModal.classList.add("active");

        // Show loading
        galleryLoading.classList.remove("hidden");
        galleryContent.classList.add("hidden");
        galleryEmpty.classList.add("hidden");

        // Fetch user's posts
        const posts = await getUserPostsById(userId, currentUserId);

        // Hide loading
        galleryLoading.classList.add("hidden");

        if (posts.length === 0) {
            // Show empty state
            galleryEmpty.classList.remove("hidden");
            galleryContent.classList.add("hidden");
        } else {
            // Show posts
            galleryContent.classList.remove("hidden");
            galleryEmpty.classList.add("hidden");

            // Render posts
            galleryContent.innerHTML = posts
                .map(
                    (post) => `
                    <div class="bg-white rounded-lg shadow-md overflow-hidden gallery-image-container">
                        <div class="relative">
                            <img 
                                src="${post.image_url}" 
                                alt="${post.title}" 
                                class="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onclick="openImageViewer('${
                                    post.image_url
                                }', '${post.title}', '${post.description}')"
                            >
                            <div class="absolute top-2 right-2">
                                <button class="like-post-btn bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all ${
                                    post.user_liked
                                        ? "text-red-500"
                                        : "text-gray-500"
                                }" 
                                        data-post-id="${post.id}" 
                                        data-post-liked="${post.user_liked}">
                                    <i data-feather="heart" class="w-4 h-4 ${
                                        post.user_liked ? "fill-current" : ""
                                    }"></i>
                                </button>
                            </div>
                        </div>
                        <div class="p-4">
                            <h4 class="font-semibold text-gray-900 mb-1 line-clamp-2">${
                                post.title
                            }</h4>
                            <p class="text-sm text-gray-600 line-clamp-2">${
                                post.description
                            }</p>
                            <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
                                <span>${new Date(
                                    post.created_at
                                ).toLocaleDateString()}</span>
                                <span class="flex items-center">
                                    <i data-feather="heart" class="w-3 h-3 mr-1"></i>
                                    ${post.likes || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                `
                )
                .join("");

            // Replace feather icons
            if (typeof feather !== "undefined") {
                feather.replace();
            }
        }

        // Modal event handlers are now managed in attachDynamicEventListeners
    } catch (error) {
        console.error("Error loading gallery:", error);
        showNotification("Failed to load gallery", "error");
    }
}
