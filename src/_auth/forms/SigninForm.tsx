import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { SigninValidation } from "../../lib/validation";
import type z from "zod";
import Loader from "../../components/shared/Loader";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/AuthContext";
import { signInAccount } from "../../lib/appwrite/api";

function SigninForm() {
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignin = async (user: z.infer<typeof SigninValidation>) => {
    try {
      const session = await signInAccount(user);
      if (!session) return toast.error("Login failed. Please try again.");

      const isLoggedIn = await checkAuthUser();
      if (isLoggedIn) {
        form.reset();
        navigate("/"); // هدایت به صفحه اصلی
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Signin error:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Form {...form}>
      <div className="sm:w-42 flex items-center flex-col">
        <img src="/assets/images/logo.svg" alt="logo" />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
          Log in to your account
        </h2>
        <p className="text-light-3 md:base-regular mt-2">
          Welcome back! Please enter your details
        </p>

        <form
          onSubmit={form.handleSubmit(handleSignin)}
          className="flex flex-col gap-5 w-full mt-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email:</FormLabel>
                <FormControl>
                  <Input type="email" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password:</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary">
            {isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-primary-500">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
}

export default SigninForm;
