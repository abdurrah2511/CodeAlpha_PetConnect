import { api } from "./api.js";

// Create post
export const createPost = async (caption, imageFile) => {
  const formData = new FormData();
  formData.append("caption", caption);
  formData.append("image", imageFile);

  return await api.createPost(formData);
};

// Like post
export const likePost = async (postId) => {
  return await api.likePost(postId);
};