export interface TokenResponseUser {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: TokenResponseUser;
}