import { api } from "./api.js";

export let page = 1;
let loading = false;
export let hasMore = true;

const isLoggedIn = !!localStorage.getItem("token");

export const postsContainer = document.getElementById("posts");

// Load posts
export const loadPosts = async () => {
  if (loading || !hasMore) return;

  loading = true;

  const posts = await api.getPosts(page);

  if (posts.length === 0) {
    hasMore = false;
    return;
  }

  posts.forEach((post) => {
    const div = document.createElement("div");
    div.className = "post-card";

    const postImgPath = post.image ? post.image.replace(/\\/g, '/') : "";
    const currentUserId = localStorage.getItem("userId");
    const isLiked = post.likes && post.likes.includes(currentUserId);

    // Dynamic timestamp formatting
    const getRelativeTime = (dateString) => {
      if (!dateString) return "2 hours ago";
      const postDate = new Date(dateString);
      const diffMs = new Date() - postDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);

      if (diffMins < 60) {
        return `${diffMins <= 0 ? 1 : diffMins} min ago`;
      } else if (diffHrs < 24) {
        return `${diffHrs} hours ago`;
      } else {
        return postDate.toLocaleDateString();
      }
    };

    div.innerHTML = `
      <div class="post-header">
        <div class="user-info" onclick="goToProfile('${post.user._id}')" style="cursor:pointer;">
          <img src="http://localhost:5000/${post.user.profilePic || post.user.profilePicDefault || ''}" class="avatar" alt="User">
          <div>
            <h3 class="username">${post.user.username}</h3>
            <p class="timestamp">${getRelativeTime(post.createdAt)}</p>
          </div>
        </div>
        <button class="btn-follow" id="follow-btn-${post.user._id}" onclick="followFromFeed('${post.user._id}')">Follow</button>
      </div>

      <img src="http://localhost:5000/${postImgPath}" class="post-img" alt="Post content">
      <p class="post-text">${post.caption}</p>

      <div class="post-footer">
        <div class="action-group">
          <button class="action-btn" id="like-btn-${post._id}" onclick="likePost('${post._id}')">
            ${isLiked ? '❤️' : '🤍'} ${post.likes ? post.likes.length : 0}
          </button>
          <button class="action-btn" onclick="toggleCommentSection('${post._id}')">
            💬 <span id="comment-count-${post._id}">0</span>
          </button>
          <button class="action-btn">🔗 Share</button>
          <button class="action-btn">🔖 Save</button>
        </div>
      </div>

      <div class="comment-area" id="comment-area-${post._id}" style="display:none;">
        <input type="text" id="comment-${post._id}" placeholder="Add comment..." class="comment-input">
        <button class="btn-send" onclick="addComment('${post._id}')">Send</button>
      </div>

      <div id="comments-${post._id}"></div>
    `;

    postsContainer.appendChild(div);
    loadComments(post._id);
    checkFollowingStatus(post.user._id);
  });

  page++;
  loading = false;
};

// Check following status for persistent synchronisation
const checkFollowingStatus = async (userId) => {
  try {
    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId");
    if (!token || !currentUserId || currentUserId === userId) return;
    
    const res = await fetch(`http://localhost:5000/api/users/${currentUserId}`, {
      headers: { Authorization: "Bearer " + token }
    });
    if (res.ok) {
      const currentUser = await res.json();
      const isFollowing = currentUser.following && currentUser.following.includes(userId);
      updateAllFollowButtons(userId, isFollowing ? "Following" : "Follow");
    }
  } catch (err) {
    console.error("Could not verify following status:", err);
  }
};

// Toggle Comment Section Visibility
window.toggleCommentSection = (postId) => {
  const area = document.getElementById(`comment-area-${postId}`);
  if (area) {
    area.style.display = area.style.display === "none" ? "flex" : "none";
  }
};

// Toggle Modal Visibility
export function toggleCreateModal() {
  const modal = document.getElementById('createPostModal');
  if (!modal) return;
  modal.classList.toggle('hidden');
  modal.classList.toggle('flex');
}

// Reset Function
function resetForm() {
  const preview = document.getElementById('preview');
  const placeholder = document.getElementById('uploadPlaceholder');
  const caption = document.getElementById('caption');
  const input = document.getElementById('imageInput');

  if (preview) {
    preview.classList.add('hidden');
    preview.src = "";
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (caption) caption.value = "";
  if (input) input.value = ""; 
}

// Preview Logic
export function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function() {
    const output = document.getElementById('preview');
    const placeholder = document.getElementById('uploadPlaceholder');
    
    output.src = reader.result;
    output.classList.remove('hidden');
    placeholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// Handle Post
export async function handlePost() {
  const caption = document.getElementById("caption").value;
  const imageInput = document.getElementById("imageInput");
  const imageFile = imageInput ? imageInput.files[0] : null;

  if (!imageFile) {
    alert("Please select an image first! 🐾");
    return;
  }

  const formData = new FormData();
  formData.append("caption", caption);
  formData.append("image", imageFile);

  try {
    await api.createPost(formData);
    alert("Post shared successfully! 🐾");
    resetForm();
    toggleCreateModal();
    
    if (typeof loadPosts === 'function') {
      postsContainer.innerHTML = "";
      page = 1;
      hasMore = true;
      await loadPosts(); 
    }
  } catch (error) {
    console.error("Post failed:", error);
    alert("Something went wrong.");
  }
}

// Like post (Live update)
window.likePost = async (postId) => {
  await api.likePost(postId);
  const currentUserId = localStorage.getItem("userId");
  
  try {
    const posts = await api.getPosts(page - 1);
    const post = posts.find(p => p._id === postId);
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    if (post && likeBtn) {
        const isLiked = post.likes && post.likes.includes(currentUserId);
        likeBtn.innerHTML = `${isLiked ? '❤️' : '🤍'} ${post.likes.length}`;
    }
  } catch(err) {
      console.error(err);
  }
};

// Add comment (Live update)
window.addComment = async (postId) => {
  const input = document.getElementById(`comment-${postId}`);
  if (!input || !input.value) return;
  await api.addComment(postId, input.value);
  input.value = "";
  loadComments(postId);
};

window.logout = () => {
  localStorage.clear();
  window.location.href = "login.html";
};

window.goToProfile = (id) => {
  window.location.href = `profile.html?id=${id}`;
};

// Update all occurrences of the follow button and ensure synchronisation across the page
const updateAllFollowButtons = (targetUserId, newStatusText) => {
  // Use the correct parameter 'newStatusText' instead of the undefined 'newText'
  const feedBtns = document.querySelectorAll(`[id^='follow-btn-${targetUserId}']`);
  feedBtns.forEach((btn) => {
    btn.innerText = newStatusText;
    btn.style.opacity = newStatusText === "Following" ? "0.6" : "1";
  });

  const sidebarBtns = document.querySelectorAll(`[id^='feed-sidebar-follow-${targetUserId}']`);
  sidebarBtns.forEach((btn) => {
    btn.innerText = newStatusText;
    btn.style.opacity = newStatusText === "Following" ? "0.6" : "1";
  });
};

window.followFromSidebar = async (id) => {
  const currentUserId = localStorage.getItem("userId");
  if (currentUserId === id) {
    alert("You cannot follow yourself! 🐾");
    return;
  }

  await api.followUser(id);
  const btn = document.getElementById(`feed-sidebar-follow-${id}`);
  const isFollowing = btn && btn.innerText.toLowerCase() === "following";
  
  updateAllFollowButtons(id, isFollowing ? "Follow" : "Following");
};

window.followFromFeed = async (userId) => {
  const currentUserId = localStorage.getItem("userId");
  if (currentUserId === userId) {
    alert("You cannot follow yourself! 🐾");
    return;
  }

  await api.followUser(userId);
  const btn = document.getElementById(`follow-btn-${userId}`);
  const isFollowing = btn && btn.innerText.toLowerCase() === "following";

  updateAllFollowButtons(userId, isFollowing ? "Follow" : "Following");
};

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100
  ) {
    loadPosts();
  }
});

// Load comments
export const loadComments = async (postId) => {
  const comments = await api.getComments(postId);
  const container = document.getElementById(`comments-${postId}`);
  const counter = document.getElementById(`comment-count-${postId}`);

  if (counter && comments) {
      counter.innerText = comments.length;
  }

  if (container) {
    container.innerHTML = comments
      .map((c) => `
      <p class="comment"><span class="bold">${c.user.username}:</span> ${c.text}</p>
      `)
      .join("");
  }
};

const loadSuggestedUsers = async () => {
  try {
    const users = await api.getUsers();
    const container = document.getElementById("suggestedUsers");

    if (!container) return;
    container.innerHTML = "";

    const currentUserId = localStorage.getItem("userId");
    const filteredUsers = users.filter(u => u._id !== currentUserId);

    filteredUsers.forEach((user) => {
      const div = document.createElement("div");
      div.className = "suggestion-row";
      
      const userPic = user.profilePic || user.profilePicDefault || "";

      div.innerHTML = `
        <div class="user-info-mini" onclick="goToProfile('${user._id}')" style="cursor:pointer;">
          <img src="http://localhost:5000/${userPic}" class="avatar-sm" alt="${user.name}">
          <span>@${user.username}</span>
        </div>
        <button class="btn-follow" id="feed-sidebar-follow-${user._id}" onclick="followFromSidebar('${user._id}')">Follow</button>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading suggested users:", error);
  }
};

// Initialization logic
async function init() {
  console.log("Initialization logic executed.");
  
  let token = localStorage.getItem("token");
  let username = localStorage.getItem("username");
  let userId = localStorage.getItem("userId");

  const authSection = document.getElementById("authSection");
  const userSection = document.getElementById("userSection");
  const usernameDisplay = document.getElementById("username");

  if (token && username && username !== "null") {
    if (authSection) authSection.style.display = "none";
    if (userSection) userSection.style.display = "flex";

    if (usernameDisplay) {
      usernameDisplay.innerText = username.toUpperCase();
      usernameDisplay.onclick = () => window.goToProfile(userId);
    }
  } else {
    if (authSection) authSection.style.display = "inline";
    if (userSection) userSection.style.display = "none";
  }

  postsContainer.innerHTML = "";
  page = 1;
  hasMore = true;
  await loadPosts();
  loadSuggestedUsers();
}

window.toggleCreateModal = toggleCreateModal;
window.previewImage = previewImage;
window.handlePost = handlePost;
window.init = init;
init();