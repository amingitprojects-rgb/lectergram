import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { checkIsLiked } from "../../lib/utils";
import {
  useDeleteSavedPost,
  useGetCurrentUser,
  useLikePost,
  useSavePost,
} from "../../lib/react-query/queriesAndMutations";
import type { IPostDoc, IUserDoc } from "../../types";

type PostStatsProps = {
  post?: IPostDoc;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();

  const initialLikes = Array.isArray(post?.likes) ? post.likes : [];
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [isSaved, setIsSaved] = useState(false);

  const { data: currentUser } = useGetCurrentUser();
  const currentUserData = currentUser as IUserDoc | null;

  const savedPostRecord = currentUserData?.save?.find(
    (record) => record.post.$id === post?.$id
  );

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();

  useEffect(() => {
    setIsSaved(!!savedPostRecord);
  }, [savedPostRecord]);

  const handleLikePost = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    const isLiked = likes.includes(userId);
    const updatedLikes = isLiked
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    setLikes(updatedLikes);
    likePost({ postId: post?.$id || '', likesArray: updatedLikes });
  };

  const handleSavePost = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();

    if (isSaved && savedPostRecord) {
      deleteSavePost(savedPostRecord.$id);
      setIsSaved(false);
    } else {
      savePost({ postId: post?.$id || '', userId });
      setIsSaved(true);
    }
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  return (
    <div
      className={`flex justify-between items-center z-20 ${containerStyles}`}
    >
      <div className="flex gap-2 mr-5">
        <img
          src={`${
            checkIsLiked(likes, userId)
              ? "/assets/icons/liked.svg"
              : "/assets/icons/like.svg"
          }`}
          alt="like"
          width={20}
          height={20}
          onClick={(e) => handleLikePost(e)}
          className="cursor-pointer"
        />
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>

      <div className="flex gap-2">
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          alt="share"
          width={20}
          height={20}
          className="cursor-pointer"
          onClick={(e) => handleSavePost(e)}
        />
      </div>
    </div>
  );
};

export default PostStats;
