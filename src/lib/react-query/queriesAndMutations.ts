import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createPost,
  createUserAccount,
  deleteSavedPost,
  getCurrentUser,
  getInfinitePosts,
  getPostById,
  getRecentPosts,
  likePost,
  savePost,
  searchPosts,
  signInAccount,
  signOutAccount,
  updatePost,
} from "../appwrite/api";
import type { IInfinitePostsResponse, INewPost, INewUser, IRawInfinitePostsResponse, IUpdatePost } from "../../types";
import type { IPostDoc } from "../../types";
import { QUERY_KEYS } from "./queryKeys";
import { appwriteConfig, databases } from "../appwrite/config";

// ===== User Mutations =====
export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: async (user: INewUser) => {
      const newUser = await createUserAccount(user);
      if (!newUser) throw new Error("Failed to create user");
      return newUser;
    },
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: async (user: { email: string; password: string }) => {
      const session = await signInAccount(user);
      if (!session) throw new Error("Failed to sign in");
      return session;
    },
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: async () => {
      const success = await signOutAccount();
      if (!success) throw new Error("Failed to sign out");
      return success;
    },
  });
};

// ===== Post Mutations =====
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      post: INewPost & { userId: string; name: string; userImageUrl: string },
    ) => {
      const newPost = await createPost(post);
      if (!newPost) throw new Error("Failed to create post");
      return newPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

// ===== Post Queries =====
export const useGetRecentPosts = () => {
  return useQuery<IPostDoc[], Error>({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

// ===== Like & Save Mutations =====
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      likesArray,
    }: {
      postId: string;
      likesArray: string[];
    }) => likePost(postId, likesArray),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      savePost(postId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useGetPostById = (postId: string) => {
  return useQuery<IPostDoc | undefined>({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: async () => {
      const post = await getPostById(postId);
      if (!post) return undefined;

      let creator = { $id: "", name: "Unknown", imageUrl: "" };
      if (typeof post.creator === "object" && post.creator !== null) {
        creator = {
          $id: post.creator.$id ?? "",
          name: post.creator.name ?? "Unknown",
          imageUrl: post.creator.imageUrl ?? "",
        };
      } else if (typeof post.creator === "string") {
        creator.$id = post.creator;
        try {
          const userDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            post.creator,
          );
          creator.name = userDoc.name ?? "Unknown";
          creator.imageUrl =
            userDoc.imageUrl ?? "/assets/icons/profile-placeholder.svg";
        } catch {
          creator.name = "Unknown";
          creator.imageUrl = "/assets/icons/profile-placeholder.svg";
        }
      }

      return {
        ...post,
        caption: post.caption ?? "",
        location: post.location ?? undefined,
        tags: Array.isArray(post.tags) ? post.tags : [],
        imageUrl: post.imageUrl ?? "",
        likes: Array.isArray(post.likes) ? post.likes : [],
        creator,
      } as IPostDoc;
    },
    enabled: !!postId,
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_POST_BY_ID] });
    },
  });
};

export const useGetPosts = () => {
  return useInfiniteQuery<
    IInfinitePostsResponse,                       // داده هر صفحه
    Error,                                        // ارور
    IInfinitePostsResponse,                       // داده برگشتی کل
    [typeof QUERY_KEYS.GET_INFINITE_POSTS]        // queryKey
    // ✅ حذف pageParam از اینجا
  >({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],

    queryFn: async (context) => {
      const pageParam = context.pageParam ?? ""; // TS حالا بدون ارور تشخیص می‌دهد

      const result: IRawInfinitePostsResponse = await getInfinitePosts(pageParam);

      return {
        documents: result.documents ?? [],
        total: result.total ?? 0,
      };
    },

    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.documents.length === 0) return undefined;
      return lastPage.documents[lastPage.documents.length - 1].$id;
    },

    initialPageParam: "", // رشته خالی
  });
};




export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};
