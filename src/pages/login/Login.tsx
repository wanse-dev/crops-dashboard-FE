import "./Login.css";
import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { LuEye, LuEyeOff } from "react-icons/lu";

import { signIn } from "../../firebase/auth";
import { useAuth } from "../../contexts/authContext";

import type { RegisterFormInputs } from "../../types/RegisterFormInputs";

const validationsSchema = Joi.object<RegisterFormInputs>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Formato de email inválido",
      "string.empty": "Se requiere un email",
    }),
  password: Joi.string().required().messages({
    "string.empty": "Se requiere una contraseña",
  }),
});

export const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: joiResolver(validationsSchema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  console.debug(auth);

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoggingIn(true);
    try {
      await signIn(data.email, data.password);
      setError(null);
    } catch (err) {
      setError("El inicio de sesión ha fallado, revisa los datos.");
      console.debug(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (auth?.userLoggedIn) return <Navigate to="/" />;

  return (
    <div className="login auth-container">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("email")}
          autoComplete="current-email"
          className="text-input"
          placeholder="Ingrese su email"
        />
        {errors.email && <span>{errors.email.message}</span>}

        <div className="password-wrapper">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="text-input password-input"
            placeholder="Ingrese su contraseña"
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
          {isLoggingIn ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
        {error && <span style={{ color: "red" }}>{error}</span>}
      </form>

      <Link to="/register">¿No tienes ningún usuario? Regístrate</Link>
    </div>
  );
};
