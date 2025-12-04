from pydantic import BaseModel, EmailStr #checks email format as well


class FirebaseTokenRequest(BaseModel):
    #Firebase ID token for authentication
    id_token: str


class RegisterRequest(BaseModel):
    #User registration request.#
    id_token: str
    firebase_uid: str
    email: EmailStr #checks email format as well
    username: str
    avatar_url: str | None = None


class TokenUser(BaseModel):
    id: int #if id is in strings it will typecast it
    username: str
    email: EmailStr #checks email format as well
    avatar_url: str | None = None
    role: str

# we send this after login/signup
class TokenResponse(BaseModel):
    #JWT token response
    access_token: str
    token_type: str = "bearer" #this is the defualt value i set
    user: TokenUser