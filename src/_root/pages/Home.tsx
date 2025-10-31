import type { Models } from "appwrite";
import Loader from "../../components/shared/Loader";
import { useGetRecentPosts } from "../../lib/react-query/queriesAndMutations";
import PostCard from "../../components/shared/PostCard";

export interface IPostDocument extends Models.Document {
  caption: string;
  location?: string;
  tags?: string[];
  imageUrl?: string;
  creator: {
    $id: string;
    name?: string;
    imageUrl?: string;
  };
}

function Home() {
  const { data: posts, isLoading, isError } = useGetRecentPosts();

  if (isError) return <p>Failed to load posts.</p>;

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {isLoading && !posts ? (
            <Loader />
          ) : (
            <ul className="flex flex-col flex-1 gap-6 w-full">
              {posts?.map((post) => (
                <PostCard key={post.$id} post={post} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
