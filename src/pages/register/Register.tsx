import "./Register.css";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { LuEye, LuEyeOff } from "react-icons/lu";
import axiosInstance from "../../config/axios";

import { createUser } from "../../firebase/auth";
import { useAuth } from "../../contexts/authContext";

import type { RegisterFormInputs } from "../../types/RegisterFormInputs";

const validationsSchema = Joi.object<RegisterFormInputs>({
  username: Joi.string().required().messages({
    "string.empty": "Se requiere un nombre de usuario",
  }),
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
      const user = await createUser(data.email, data.password);
      const sendData = {
        uid_usuario: user.uid,
        nombre: data.username,
      };
      const response = await axiosInstance.post("/usuario", sendData);
      console.debug("User created in backend:", response.data);
      navigate("/");
    } catch (error) {
      console.error("Error during registration:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="register">
        <h1>Registrar una cuenta</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register("username")}
            className="text-input"
            placeholder="Ingrese un nombre de usuario"
          />
          {errors.username && <span>{errors.username.message}</span>}

          <input
            {...register("email")}
            autoComplete="current-email"
            className="text-input"
            placeholder="Ingrese un email"
          />
          {errors.email && <span>{errors.email.message}</span>}

          <div className="password-wrapper">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="text-input password-input"
              placeholder="Ingrese una contraseña"
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
            {isRegistering ? "Creando usuario..." : "Registrarse"}
          </button>
        </form>

        <Link to="/login">¿Ya tienes una cuenta? Iniciar sesión</Link>
      </div>
    </div>
  );
};
