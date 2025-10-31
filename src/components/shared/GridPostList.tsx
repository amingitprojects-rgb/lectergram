import { useEffect, useState } from "react";
import { useUserContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import type { IPostDoc } from "../../types";
import { databases, appwriteConfig } from "../../lib/appwrite/config";
import PostStats from "./PostStats";

type GridPostListProps = {
  posts: IPostDoc[];
  showUser?: boolean;
  showStats?: boolean;
};

function GridPostList({
  posts,
  showUser = true,
  showStats = true,
}: GridPostListProps) {
  const { user } = useUserContext();
  const [creators, setCreators] = useState<
    Record<string, { name: string; imageUrl: string }>
  >({});

  useEffect(() => {
    const fetchCreators = async () => {
      const uniqueIds = [
        ...new Set(
          posts
            .map((p) =>
              typeof p.creator === "string" ? p.creator : p.creator?.$id
            )
            .filter(Boolean)
        ),
      ];

      const newCreators: Record<string, { name: string; imageUrl: string }> =
        {};

      for (const id of uniqueIds) {
        try {
          const userDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            id as string
          );
          newCreators[id as string] = {
            name: userDoc.name ?? "Unknown",
            imageUrl:
              userDoc.imageUrl ?? "/assets/icons/profile-placeholder.svg",
          };
        } catch {
          newCreators[id as string] = {
            name: "Unknown",
            imageUrl: "/assets/icons/profile-placeholder.svg",
          };
        }
      }

      setCreators(newCreators);
    };

    if (posts.length > 0) fetchCreators();
  }, [posts]);

  return (
    <ul className="grid-container">
      {posts.map((post) => {
        if (!post) return null;

        const creatorId =
          typeof post.creator === "object" ? post.creator.$id : post.creator;

        const creator = creators[creatorId] || {
          name: "Unknown",
          imageUrl: "/assets/icons/profile-placeholder.svg",
        };

        return (
          <li key={post.$id} className="relative min-w-80 h-80">
            <Link to={`/posts/${post.$id}`} className="grid-post_link">
              <img
                src={post.imageUrl}
                alt="post"
                className="h-full w-full object-cover"
              />
            </Link>

            <div className="grid-post_user">
              {showUser && (
                <div className="flex items-center justify-start gap-2 flex-1">
                  <img
                    src={creator.imageUrl}
                    alt="creator"
                    className="w-8 h-8 rounded-full"
                  />
                  <p className="line-clamp-1">{creator.name}</p>
                </div>
              )}
              {showStats && <PostStats post={post} userId={user.id} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default GridPostList;
