// services/blogService.ts

import { apiFetch } from "@/lib/api";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  createdAt: string;
}

export const getPosts = async (): Promise<BlogPost[]> => {
  const res = await apiFetch("/api/posts");
  return res.json();
};

export const getPostBySlug = async (slug: string): Promise<BlogPost> => {
  const res = await apiFetch(`/api/posts/${slug}`);
  return res.json();
};

export const createPost = async (post: Omit<BlogPost, "id" | "createdAt">) => {
  const res = await apiFetch("/api/posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
  return res.json();
};