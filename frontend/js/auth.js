import { api } from "./api.js";

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await api.login({ email, password });

  if (res.token) {
    localStorage.setItem("token", res.token);
    
    // Store user data dynamically depending on structure
    const user = res.user || res;
    localStorage.setItem("username", user.username);
    
    // Check for standard ID formats
    const uId = user._id || user.id || res.id;
    if (uId) {
      localStorage.setItem("userId", uId);
    }

    window.location.href = "feed.html";
  } else {
    alert(res.message || "Login failed. Please check your credentials.");
  }
};


  let selectedAvatar = "/defaults/avatar1.png"; // default

  window.selectAvatar = (img) => {
    document.querySelectorAll("#avatars img").forEach((i) =>
      i.classList.remove("selected")
    );

    img.classList.add("selected");

    selectedAvatar = img.getAttribute("src").replace("../assets", "");
  };

  window.signup = async () => {
    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const bio = document.getElementById("bio").value;
    const password = document.getElementById("password").value;

    if (!name || !username || !email || !bio || !password ) {
      alert("Please fill all fields");
      return;
    }

    const res = await api.register({
      name,
      username,
      email,
      bio,
      password,
      profilePic: selectedAvatar,
    });

    if (res.token) {
      localStorage.setItem("token", res.token);
      window.location.href = "login.html";
    } else {
      alert(res.message || "Signup failed. Please check your credentials.");
    }
  };