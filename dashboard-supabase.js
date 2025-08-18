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
        price: 3,
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
        price: 8,
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
    visionary: { name: "Visionary", price: 25, unlocks: ["*"] },
};

// --- TABS CONFIGURATION ---
const memberTabs = [
    { id: "home", name: "Home", icon: "home", access: "free" },
    { id: "explore", name: "Explore", icon: "compass", access: "free" },
    { id: "gallery", name: "Gallery", icon: "image", access: "free" },
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
    home: (userData) => `
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
                    <p class="text-3xl font-bold mt-2">3</p>
                </div>
                <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                     <h3 class="text-sm font-medium text-gray-500">Active Jobs</h3>
                    <p class="text-3xl font-bold mt-2">1</p>
                </div>
                <div class="stat-card bg-white p-6 rounded-lg shadow text-center">
                     <h3 class="text-sm font-medium text-gray-500">Completed Jobs</h3>
                    <p class="text-3xl font-bold mt-2">12</p>
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
    `,
    jobs: (userData) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Jobs & Requests</h1>
            <p class="text-gray-600">Track your job pipeline and manage communications.</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">Coming Soon!</h3>
            <p class="text-gray-600">Job tracking features are being developed.</p>
        </div>
    `,
    earnings: (userData) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Earnings & Progress</h1>
            <p class="text-gray-600">Manage your finances and track your growth.</p>
        </div>
        <div class="bg-white p-8 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">Coming Soon!</h3>
            <p class="text-gray-600">Earnings tracking features are being developed.</p>
        </div>
    `,
    extras: (userData) => `
        <div class="text-center py-20">
            <div class="inline-block bg-gray-200 p-6 rounded-full mb-6">
                 <i data-feather="clock" class="w-16 h-16 text-gray-500"></i>
            </div>
            <h1 class="text-4xl font-bold text-gray-900">Coming Soon!</h1>
            <p class="text-gray-600 mt-4 max-w-2xl mx-auto">We're working hard to bring you exciting new features like events, a digital store, a learning hub, and a community forum. Stay tuned!</p>
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
                             onerror="this.onerror=null; this.src='https://placehold.co/400x300/EBF4FF/3B82F6?text=Image+Not+Found'; this.classList.add('opacity-50'); console.error('Image failed to load:', post.image_url);"
                             onload="this.classList.remove('image-loading'); this.classList.add('image-loaded'); console.log('Image loaded successfully:', post.image_url);">
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
                        <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 follow-btn" 
                                data-user-id="${user.id}">
                            ${
                                currentUserRole === "member" &&
                                user.role === "apprentice"
                                    ? "Connect"
                                    : "Follow"
                            }
                        </button>
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
                        <h4 class="text-xl font-semibold text-gray-700 mb-2">No recommendations yet</h4>
                        <p class="text-gray-500">Complete your profile to get personalized recommendations</p>
                    </div>
                `
                }
            </div>
        </div>

        <!-- Trending Creators -->
        <div class="mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Trending ${targetRoleText}</h3>
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div id="trending-creators-list">
                    <div class="p-6 text-center text-gray-500">
                        <div class="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading trending ${targetRoleText.toLowerCase()}...
                    </div>
                </div>
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
                             onerror="this.onerror=null; this.src='https://placehold.co/400x300/EBF4FF/3B82F6?text=Image+Not+Found'; this.classList.add('opacity-50'); console.error('Image failed to load:', post.image_url);"
                             onload="this.classList.remove('image-loading'); this.classList.add('image-loaded'); console.log('Image loaded successfully:', post.image_url);">
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
                    <p class="text-3xl font-bold text-blue-600 mb-4">${
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
    earnings: (userData) => `
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Earn Points</h1>
            <p class="text-gray-600">Complete tasks and refer friends to earn points</p>
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
    `,
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
        const button = e.target;

        // Get current user from Supabase
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            alert("Please log in to follow users");
            return;
        }

        if (!targetUserId) {
            console.error("No target user ID found");
            alert("Error: Invalid user");
            return;
        }

        if (targetUserId === user.id) {
            alert("You cannot follow yourself");
            return;
        }

        console.log("Follow button clicked:", {
            currentUser: user.id,
            targetUser: targetUserId,
        });

        try {
            // Update button state immediately
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = "Following...";
            button.classList.add("opacity-50");

            const success = await followUser(user.id, targetUserId);

            if (success) {
                button.textContent = "Followed!";
                button.classList.remove(
                    "bg-blue-600",
                    "hover:bg-blue-700",
                    "opacity-50"
                );
                button.classList.add("bg-green-600");

                // Show success for 2 seconds, then change to "Following"
                setTimeout(() => {
                    button.textContent = "Following";
                    button.classList.remove("bg-green-600");
                    button.classList.add("bg-gray-400", "cursor-not-allowed");
                }, 2000);
            } else {
                throw new Error("Failed to follow user");
            }
        } catch (error) {
            console.error("Error in follow button handler:", error);

            // Reset button state
            button.disabled = false;
            button.textContent = "Follow";
            button.classList.remove("opacity-50");

            // Show user-friendly error message
            let errorMessage = "Error following user. Please try again.";
            if (error.message.includes("permission")) {
                errorMessage =
                    "Permission denied. Please try refreshing the page.";
            } else if (error.message.includes("network")) {
                errorMessage = "Network error. Please check your connection.";
            }

            alert(errorMessage);
        }
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
            // Update button state immediately
            likeBtn.disabled = true;
            const heartIcon = likeBtn.querySelector("i[data-feather='heart']");
            const likeCount = likeBtn.querySelector(".like-count");

            // Toggle like
            const result = await togglePostLike(postId, user.id);

            if (result.action === "liked") {
                // Update UI for liked state
                likeBtn.classList.remove("text-gray-400", "hover:text-red-500");
                likeBtn.classList.add("text-red-500");
                heartIcon.classList.add("fill-current");
                likeBtn.dataset.postLiked = "true";

                // Update count
                const currentCount = parseInt(likeCount.textContent) || 0;
                likeCount.textContent = currentCount + 1;
            } else {
                // Update UI for unliked state
                likeBtn.classList.remove("text-red-500");
                likeBtn.classList.add("text-gray-400", "hover:text-red-500");
                heartIcon.classList.remove("fill-current");
                likeBtn.dataset.postLiked = "false";

                // Update count
                const currentCount = parseInt(likeCount.textContent) || 0;
                likeCount.textContent = Math.max(0, currentCount - 1);
            }

            // Show notification
            showNotification(`Post ${result.action}!`, "success");
        } catch (error) {
            console.error("Error in like button handler:", error);

            // Reset button state
            likeBtn.disabled = false;

            // Show error message
            let errorMessage = "Error updating like. Please try again.";
            if (error.message.includes("permission")) {
                errorMessage =
                    "Permission denied. Please try refreshing the page.";
            }

            showNotification(errorMessage, "error");
        } finally {
            likeBtn.disabled = false;
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

    const spinner = document.getElementById("edit-spinner");
    const submitBtn = document.getElementById("submit-edit-profile");

    if (spinner) spinner.classList.remove("hidden");
    if (submitBtn) submitBtn.disabled = true;

    try {
        const dataToUpdate = { name: newName };
        if (userData.role === "member") {
            dataToUpdate.creative_type = newCreativeType;
        }

        await updateUserProfile(userData.id, dataToUpdate);

        // Update userData object
        userData.name = newName;
        if (userData.role === "member") {
            userData.creative_type = newCreativeType;
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

function openImageViewer(imageUrl, title) {
    const modal = document.getElementById("image-viewer-modal");
    const image = document.getElementById("viewer-image");
    const titleEl = document.getElementById("viewer-title");

    if (modal && image && titleEl) {
        image.src = imageUrl;
        titleEl.textContent = title;
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
    // Remove existing notifications
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full`;

    // Set color based on type
    if (type === "success") {
        notification.classList.add("bg-green-600");
    } else if (type === "error") {
        notification.classList.add("bg-red-600");
    } else {
        notification.classList.add("bg-blue-600");
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove("translate-x-full");
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add("translate-x-full");
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
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
        } else {
            // Default content rendering
            content = templates[tabId]
                ? templates[tabId](userData)
                : `<div class="text-center py-12"><p class="text-gray-500">Content not available.</p></div>`;
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

// --- Event Listeners for Modals ---
document.addEventListener("DOMContentLoaded", () => {
    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            e.target.classList.remove("active");
        }
    });

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
