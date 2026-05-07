import { api } from "./api.js";

const profileDiv = document.getElementById("profile");
const postsDiv = document.getElementById("userPosts");

// Get userId from URL
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

// Store the fetched posts in memory
let userPostsData = [];

// Load profile
const loadProfile = async () => {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  const user = await res.json();
  const userPic = user.profilePic || user.profilePicDefault || "";

  // Check if current user is following the loaded profile user
  const isFollowing = user.followers && user.followers.includes(currentUserId);

  profileDiv.innerHTML = `
    <div class="header-content">
      <img src="http://localhost:5000/${userPic}" class="profile-avatar" alt="Profile" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover;">
      
      <div class="profile-info">
        <div class="name-row">
          <h2 class="profile-name">@${user.username}</h2>
          <span class="profile-handle">${user.name}</span>
        </div>

        <p class="profile-bio">${user.bio || "No bio yet"}</p>

        <div class="profile-stats">
          <span><strong id="postCountDisplay">0</strong> Posts</span>
          <span><strong>${user.followers ? user.followers.length : 0}</strong> Followers</span>
          <span><strong>${user.following ? user.following.length : 0}</strong> Following</span>
        </div>

        <button class="btn-follow" id="follow-btn-${user._id}" onclick="followUser('${user._id}')">
          ${isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  `;
};

// Follow
window.followUser = async (id) => {
  const currentUserId = localStorage.getItem("userId");
  if (currentUserId === id) {
    alert("You cannot follow yourself! 🐾");
    return;
  }

  await fetch(`http://localhost:5000/api/users/${id}/follow`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  const btn = document.getElementById(`follow-btn-${id}`);
  if (btn) {
    if (btn.innerText.toLowerCase() === "follow") {
      btn.innerText = "Following";
      btn.style.opacity = "0.6";
    } else {
      btn.innerText = "Follow";
      btn.style.opacity = "1";
    }
  }
  loadProfile();
};

const loadUserPosts = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get("id"); // Profile's user ID

    const posts = await api.getPosts();

    userPostsData = posts.filter((p) => {
      const postOwnerId = p.user?._id || p.user?.id || p.user;
      return postOwnerId === targetUserId;
    });

    const postCountDisplay = document.getElementById("postCountDisplay");
    if (postCountDisplay) {
      postCountDisplay.innerText = userPostsData.length;
    }

    if (userPostsData.length > 0) {
      postsDiv.innerHTML = userPostsData
        .map(
          (p) => `
          <div>
            <img class="grid-img" onclick="openModal('${p._id}')" src="http://localhost:5000/${p.image}" width="150" style="cursor:pointer;" />
          </div>
        `
        )
        .join("");
    } else {
      postsDiv.innerHTML = `<p style="text-align: center; color: gray;">No posts to display.</p>`;
    }
  } catch (error) {
    console.error("Error loading user posts:", error);
    postsDiv.innerHTML = `<p style="text-align: center; color: red;">Error loading posts.</p>`;
  }
};

export function toggleCreateModal() {
  const modal = document.getElementById('createPostModal');
  if (!modal) return;
  modal.classList.toggle('hidden');
  modal.classList.toggle('flex');
}

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

window.handlePost = async () => {
  const caption = document.getElementById("caption").value;
  const imageInput = document.getElementById("imageInput");
  
  const userId = localStorage.getItem("userId");
  
  if (!caption && !imageInput.files[0]) {
    alert("Please add a caption or an image.");
    return;
  }

  const formData = new FormData();
  formData.append("caption", caption);
  if (imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  }
  formData.append("userId", userId);

  const res = await api.createPost(formData);
  
  if (res.error) {
    alert("Failed to create post");
  } else {
    alert("Post created successfully!");
    toggleCreateModal();
    loadUserPosts();
  }
};

window.likePost = async (postId) => {
  await api.likePost(postId);
  const currentUserId = localStorage.getItem("userId");
  
  try {
    const posts = await api.getPosts();
    const post = posts.find(p => p._id === postId);
    const likeBtn = document.getElementById(`modalLikesBtn`);
    if (post && likeBtn) {
        const isLiked = post.likes && post.likes.includes(currentUserId);
        likeBtn.innerHTML = `${isLiked ? '❤️' : '🤍'} ${post.likes.length}`;
    }
  } catch(err) {
      console.error(err);
  }
};

window.addComment = async (postId) => {
  const input = document.getElementById(`modalCommentInput`);
  if (!input || !input.value) return;
  await api.addComment(postId, input.value);
  input.value = "";
  loadModalComments(postId);
};

const loadModalComments = async (postId) => {
  const comments = await api.getComments(postId);
  const container = document.getElementById(`modalCommentsList`);
  const counter = document.getElementById(`modalCommentsBtn`);

  if (counter && comments) {
    counter.innerText = `💬 ${comments.length}`;
  }

  if (container) {
    if (comments && comments.length > 0) {
      container.innerHTML = comments
        .map((c) => `<p class="comment-text"><span class="font-bold">${c.user?.username || "Unknown"}:</span> ${c.text}</p>`)
        .join("");
    } else {
      container.innerHTML = `<p class="text-gray-500">No comments yet.</p>`;
    }
  }
};

window.openModal = (postId) => {
  const post = userPostsData.find((p) => p._id === postId);
  if (!post) return;

  window.currentOpenPostId = postId;

  document.getElementById("modalImage").src = `http://localhost:5000/${post.image}`;
  document.getElementById("modalUsername").textContent = `@${post.user?.username || "user"}`;
  document.getElementById("modalCaptionText").textContent = post.caption || "";

  const currentUserId = localStorage.getItem("userId");
  const isLiked = post.likes && post.likes.includes(currentUserId);
  
  document.getElementById("modalLikesBtn").innerHTML = `${isLiked ? '❤️' : '🤍'} ${post.likes?.length || 0}`;
  
  loadModalComments(postId);

  const modal = document.getElementById("postModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.closeModal = () => {
  const modal = document.getElementById("postModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
};

window.logout = () => {
  localStorage.clear();
  window.location.href = "login.html";
};

window.goToProfile = (id) => {
  window.location.href = `profile.html?id=${id}`;
};

// Profile Init
const init = async () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const authSection = document.getElementById("authSection");
  const userSection = document.getElementById("userSection");
  const usernameDisplay = document.getElementById("username");

  if (token && username && username !== "null") {
    if (authSection) authSection.style.display = "none";
    if (userSection) userSection.style.display = "flex";

    if (usernameDisplay) {
      usernameDisplay.innerText = username.toUpperCase();
      usernameDisplay.onclick = () => window.goToProfile(localStorage.getItem("userId"));
    }
  } else {
    if (authSection) authSection.style.display = "inline";
    if (userSection) userSection.style.display = "none";
  }

  await loadProfile();
  await loadUserPosts();

  // Profile view conditional check to hide "+ Post" on others' profiles
  const urlParams = new URLSearchParams(window.location.search);
  const profileUserId = urlParams.get("id");
  const currentUserId = localStorage.getItem("userId");
  
  const postButton = document.getElementById("userPostBtn");

  if (profileUserId && profileUserId !== currentUserId) {
    if (postButton) {
      postButton.style.display = "none";
    }
  } else {
    if (postButton) {
      postButton.style.display = "flex";
    }
  }
};

window.toggleCreateModal = toggleCreateModal;
window.previewImage = previewImage;
window.handlePost = handlePost;

init();