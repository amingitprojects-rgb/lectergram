import type { Models } from "appwrite";
import type React from "react";

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio?: string;
};

export type IContextType = {
  user: IUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: string;
  file: File[];
  location?: string;
  tags?: string;
};

export interface IUserDoc extends Models.Document {
  name: string;
  username?: string;
  email?: string;
  imageUrl?: string;
  bio?: string;
  save?: ISaveRecord[];
}

export interface IPostDoc extends Models.Document {
  caption: string;
  imageId?: string;
  imageUrl?: string;
  location?: string;
  tags?: string[];
  creator: { $id: string; name?: string; imageUrl?: string } | string;
  likes: string[];
}

export interface ISaveRecord extends Models.Document {
  post: { $id: string } & Partial<IPostDoc>;
  user?: { $id: string; name?: string; imageUrl?: string };
}
