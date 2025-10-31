import { Link } from "react-router-dom";
import type { IPostDoc } from "../../types";
import { formatDate } from "../../lib/utils";
import { useUserContext } from "../../context/AuthContext";
import PostStats from "./PostStats";

type PostCardProps = { post: IPostDoc };

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();

  const creator =
    typeof post.creator === "string"
      ? { $id: post.creator, name: "Unknown", imageUrl: "" }
      : post.creator;

  const creatorId = creator.$id || "";
  const creatorName = creator.name || "Unknown";
  const creatorImage =
    creator.imageUrl && creator.imageUrl.length > 0
      ? creator.imageUrl
      : "/assets/icons/profile-placeholder.svg";

  const postImage = post.imageUrl || "/assets/icons/profile-placeholder.svg";

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${creatorId}`}>
            <img
              src={creatorImage}
              alt={creatorName}
              className="rounded-full w-12 h-12 lg:h-12"
            />
          </Link>
          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {creatorName}
            </p>
            <div className="flex-center gap-2 text-light-3">
              <p className="subtle-semibold lg:small-regular">
                {formatDate(post.$createdAt)}
              </p>
              {post.location && <span>-</span>}
              <p className="subtle-semibold lg:small-regular">
                {post.location}
              </p>
            </div>
          </div>
        </div>

        {user?.id === creatorId && (
          <Link to={`/update-post/${post.$id}`}>
            <img
              src="/assets/icons/edit.svg"
              alt="edit"
              width={20}
              height={20}
            />
          </Link>
        )}
      </div>

      <Link to={`/posts/${post.$id}`}>
        <div className="small-medium lg:base-medium py-5">
          <p>{post.caption}</p>
          {post.tags && post.tags.length > 0 && (
            <ul className="flex gap-1 mt-2">
              {post.tags.map((tag) => (
                <li key={tag} className="text-light-3">
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </div>

        <img src={postImage} alt="post" className="post-card_img" />
      </Link>

      <PostStats post={post} userId={user.id} />
    </div>
  );
};

export default PostCard;
