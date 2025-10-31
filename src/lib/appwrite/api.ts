import { ID, Query } from "appwrite";
import type {
  INewPost,
  INewUser,
  IPostDoc,
  IUpdatePost,
  IUserDoc,
} from "../../types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";
import type { ImageGravity, Models } from "appwrite";

// ===== User APIs =====
export async function createUserAccount(
  user: INewUser
): Promise<IUserDoc | null> {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );
    if (!newAccount) throw new Error("Account creation failed");

    const avatarUrl = avatars.getInitials(user.name);

    const rawUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        name: newAccount.name,
        email: newAccount.email,
        username: user.username,
        imageUrl: avatarUrl,
      }
    );

    const userDoc: IUserDoc = {
      ...rawUser,
      name: rawUser.name || "Unknown",
      username: rawUser.username || "",
      email: rawUser.email || "",
      imageUrl: rawUser.imageUrl || "",
      bio: rawUser.bio || "",
      save: rawUser.save || [],
    };

    return userDoc;
  } catch (error) {
    console.error("createUserAccount error:", error);
    return null;
  }
}

export async function signInAccount(user: {
  email: string;
  password: string;
}): Promise<Models.Session | null> {
  try {
    await account.deleteSession("current").catch(() => {});
    return await account.createEmailPasswordSession(user.email, user.password);
  } catch (error) {
    console.error("signInAccount error:", error);
    return null;
  }
}

export async function signOutAccount(): Promise<boolean> {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error("signOutAccount error:", error);
    return false;
  }
}

export async function getCurrentUser(): Promise<IUserDoc | null> {
  try {
    const accountData = await account.get();

    const userList = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", accountData.$id)]
    );

    if (!userList.documents.length) return null;

    const rawUser = userList.documents[0];

    const userDoc: IUserDoc = {
      ...rawUser, // فیلدهای سیستمی
      name: rawUser.name || "Unknown",
      username: rawUser.username || "",
      email: rawUser.email || "",
      imageUrl: rawUser.imageUrl || "",
      bio: rawUser.bio || "",
      save: rawUser.save || [],
    };

    return userDoc;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

// ===== File APIs =====
export async function uploadFile(file: File) {
  try {
    return await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );
  } catch (error) {
    console.error("uploadFile error:", error);
    return null;
  }
}

export async function getFilePreview(fileId: string) {
  try {
    if (!fileId) return null;
    return await storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "center" as ImageGravity,
      100
    );
  } catch (error) {
    console.error("getFilePreview error:", error);
    return null;
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);
    return true;
  } catch (error) {
    console.error("deleteFile error:", error);
    return false;
  }
}

// ===== Post APIs =====
export async function createPost(post: INewPost & { userId: string }) {
  try {
    if (!post.file || post.file.length === 0)
      throw new Error("No file provided");

    const uploadedFile = await uploadFile(post.file[0]);
    if (!uploadedFile) throw new Error("File upload failed");

    const fileUrl = await storage.getFileView(
      appwriteConfig.storageId,
      uploadedFile.$id
    );
    if (!fileUrl) throw new Error("Failed to get file URL");

    const tags = post.tags?.replace(/\s+/g, "").split(",") || [];

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
        likes: [],
      }
    );

    return newPost as unknown as IPostDoc;
  } catch (error) {
    console.error("createPost error:", error);
    throw error;
  }
}

export async function getRecentPosts(): Promise<IPostDoc[]> {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)]
    );

    const formattedPosts: IPostDoc[] = await Promise.all(
      posts.documents.map(async (doc) => {
        let creator = { $id: "", name: "Unknown", imageUrl: "" };

        if (typeof doc.creator === "object" && doc.creator !== null) {
          creator = {
            $id: doc.creator.$id ?? "",
            name: doc.creator.name ?? "Unknown",
            imageUrl: doc.creator.imageUrl ?? "",
          };
        } else if (typeof doc.creator === "string") {
          creator.$id = doc.creator;
          try {
            const userDoc = await databases.getDocument(
              appwriteConfig.databaseId,
              appwriteConfig.userCollectionId,
              doc.creator
            );
            creator.name = userDoc.name ?? "Unknown";
            creator.imageUrl =
              userDoc.imageUrl ?? "/assets/icons/profile-placeholder.svg";
          } catch {
            creator.name = "Unknown";
            creator.imageUrl = "/assets/icons/profile-placeholder.svg";
          }
        }

        let imageUrl = doc.imageUrl;
        if (!imageUrl && doc.imageId) {
          try {
            imageUrl = await storage.getFileView(
              appwriteConfig.storageId,
              doc.imageId
            );
          } catch {
            imageUrl = "/assets/icons/profile-placeholder.svg";
          }
        }

        return {
          ...doc,
          caption: doc.caption ?? "",
          location: doc.location ?? undefined,
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          imageUrl,
          likes: Array.isArray(doc.likes) ? doc.likes : [],
          creator,
        } as IPostDoc;
      })
    );

    return formattedPosts;
  } catch (error) {
    console.error("getRecentPosts error:", error);
    return [];
  }
}

// ===== Like & Save =====
export async function likePost(postId: string, likesArray: string[]) {
  try {
    return await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      { likes: likesArray }
    );
  } catch (error) {
    console.error("likePost error:", error);
    return null;
  }
}

export async function savePost(postId: string, userId: string) {
  try {
    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      { user: userId, post: postId }
    );
  } catch (error) {
    console.error("savePost error:", error);
    return null;
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    );
    return true;
  } catch (error) {
    console.error("deleteSavedPost error:", error);
    return false;
  }
}

export async function getPostById(postId: string) {
  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    return post;
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file && post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw new Error("File upload failed");

      const fileUrl = storage.getFileView(
        appwriteConfig.storageId,
        uploadedFile.$id
      );

      image = {
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
      };
    }

    const tagsArray =
      typeof post.tags === "string"
        ? post.tags.replace(/\s+/g, "").split(",")
        : post.tags || [];

    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location || "",
        tags: tagsArray,
      }
    );

    if (!updatedPost) {
      throw new Error("Post update failed");
    }

    return updatedPost;
  } catch (error) {
    console.error("updatePost error:", error);
    throw error;
  }
}

export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam?: string }) {
  const queries: any[] = [Query.orderDesc("$updatedAt"), Query.limit(10)];
  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam));
  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    );

    if (!posts) throw Error;

    const formattedPosts = await Promise.all(
      posts.documents.map(async (doc) => {
        let creator = { $id: "", name: "Unknown", imageUrl: "" };

        if (typeof doc.creator === "string") {
          creator.$id = doc.creator;
          try {
            const userDoc = await databases.getDocument(
              appwriteConfig.databaseId,
              appwriteConfig.userCollectionId,
              doc.creator
            );
            creator.name = userDoc.name ?? "Unknown";
            creator.imageUrl =
              userDoc.imageUrl ?? "/assets/icons/profile-placeholder.svg";
          } catch {
            creator.name = "Unknown";
            creator.imageUrl = "/assets/icons/profile-placeholder.svg";
          }
        } else if (typeof doc.creator === "object") {
          creator = {
            $id: doc.creator.$id ?? "",
            name: doc.creator.name ?? "Unknown",
            imageUrl: doc.creator.imageUrl ?? "",
          };
        }

        return {
          $id: doc.$id,
          $sequence: doc.$sequence,
          caption: doc.caption ?? "",
          imageUrl: doc.imageUrl ?? "",
          location: doc.location ?? "",
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          likes: Array.isArray(doc.likes) ? doc.likes : [],
          creator,
          $collectionId: doc.$collectionId,
          $databaseId: doc.$databaseId,
          $createdAt: doc.$createdAt,
          $updatedAt: doc.$updatedAt,
          $permissions: doc.$permissions,
        } as IPostDoc;
      })
    );

    return {
      ...posts,
      documents: formattedPosts,
    };
  } catch (error) {
    console.error("getInfinitePosts error:", error);
    return { documents: [] };
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments<IPostDoc>(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", searchTerm)]
    );

    if (!posts) throw new Error("No posts found");
    return posts; 
  } catch (error) {
    console.error(error);
    throw error;
  }
}
