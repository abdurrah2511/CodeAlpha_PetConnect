const API_URL = "http://localhost:5000/api";

// Get token
const getToken = () => localStorage.getItem("token");


// Common headers
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + getToken(),
});

// API functions
export const api = {
  register: async (data) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  login: async (data) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getPosts: async (page = 1) => {
  const res = await fetch(`${API_URL}/posts?page=${page}`, {
    headers: getHeaders(),
  });
  return res.json();
  },

  createPost: async (formData) => {
    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getToken(),
      },
      body: formData,
    });
    return res.json();
  },

  likePost: async (postId) => {
    const res = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return res.json();
  },

  addComment: async (postId, text) => {
    const res = await fetch(`${API_URL}/comments/${postId}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  getComments: async (postId) => {
    const res = await fetch(`${API_URL}/comments/${postId}`, {
      headers: getHeaders(),
    });
    return res.json();
  },
  
  getUsers: async () => {
    const token = getToken();

    console.log("TOKEN SENT:", token); // DEBUG

    const res = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    return res.json();
  },
  

followUser: async (id) => {
  const res = await fetch(`${API_URL}/users/${id}/follow`, {
    method: "PUT",
    headers: getHeaders(),
  });
  return res.json();
},
};