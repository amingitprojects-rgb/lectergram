import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PostValidation } from "../../lib/validation";
import { useUserContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreatePost,
  useUpdatePost,
} from "../../lib/react-query/queriesAndMutations";
import { Button } from "../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../ui/textarea";
import FileUploader from "../shared/FileUploader";
import type { IPostDoc } from "../../types";

type PostFormProps = {
  action: "Create" | "Update";
  post?: IPostDoc;
};

function PostForm({ action, post }: PostFormProps) {
  const { user, isAuthenticated } = useUserContext();
  const navigate = useNavigate();
  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: updatePost } = useUpdatePost();

  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post?.caption || "",
      file: [] as File[],
      location: post?.location || "",
      tags: post?.tags?.join(",") || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof PostValidation>) => {
    if (!isAuthenticated || !user?.id) {
      toast.error("You must be signed in to post");
      return;
    }

    try {
      if (action === "Update" && post) {
        await updatePost({
          postId: post.$id,
          caption: values.caption,
          location: values.location || "",
          tags: values.tags || "",
          file: values.file || [],
          imageId: post.imageId ?? "",
          imageUrl: post.imageUrl ?? "",
        });
        toast.success("Post updated successfully!");
      } else if (action === "Create") {
        await createPost({
          caption: values.caption,
          location: values.location || "",
          tags: values.tags || "",
          file: values.file || [],
          userId: user.id,
          name: user.name,
          userImageUrl: user.imageUrl,
        });
        toast.success("Post created successfully!");
      }

      form.reset();
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-full max-w-5xl"
      >
        {/* Caption */}
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caption:</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Image:</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.imageUrl || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location:</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (comma separated):</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Art, Music, Travel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
          >
            {action}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default PostForm;
