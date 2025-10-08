import type { UserData } from "./UserData";

export interface AuthData {
  currentUser: UserData | null;
  userLoggedIn: boolean;
  loading: boolean;
}