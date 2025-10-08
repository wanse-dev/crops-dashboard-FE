import "./Register.css";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { LuEye, LuEyeOff } from "react-icons/lu";

import { createUser } from "../../firebase/auth";
import { useAuth } from "../../contexts/authContext";

import type { RegisterFormInputs } from "../../types/RegisterFormInputs";

const validationsSchema = Joi.object<RegisterFormInputs>({
  username: Joi.string().required().messages({
    "string.empty": "Username is required",
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Invalid email format",
      "string.empty": "Email is required",
    }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: joiResolver(validationsSchema),
  });

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const auth = useAuth();

  console.debug(auth);

  if (auth?.userLoggedIn) return <Navigate to="/" />;

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsRegistering(true);
    try {
      await createUser(data.email, data.password);
      navigate("/tasks");
    } catch (error) {
      console.error("Error during registration:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="register">
      <h1>Register your account</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("username")}
          className="text-input"
          placeholder="Enter username"
        />
        {errors.username && <span>{errors.username.message}</span>}

        <input
          {...register("email")}
          autoComplete="current-email"
          className="text-input"
          placeholder="Enter email"
        />
        {errors.email && <span>{errors.email.message}</span>}

        <div className="password-wrapper">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="text-input password-input"
            placeholder="Enter password"
          />
          <button
            type="button"
            className="toggle-password-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
          </button>
        </div>
        {errors.password && <span>{errors.password.message}</span>}

        <button type="submit" className="submit-button">
          {isRegistering ? "Creating user..." : "Register"}
        </button>
      </form>

      <Link to="/login">Already have an user? Sign in</Link>
    </div>
  );
};
