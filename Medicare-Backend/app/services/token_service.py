from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import RoleEnum

SECRET_KEY = "supersecretkey"
REFRESH_SECRET_KEY = "refreshsupersecret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ---------------- Token Creation ---------------- #

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str, refresh=False):
    secret = REFRESH_SECRET_KEY if refresh else SECRET_KEY
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("TOKEN EXPIRED")
        raise HTTPException(status_code=401, detail="Token expired. Please login again.")
    except Exception as e:
        print("TOKEN INVALID:", str(e))
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- Role Validation ---------------- #

def require_role(required_role: RoleEnum):
    def role_checker(token: str = Depends(oauth2_scheme)):
        payload = decode_token(token)
        user_role = payload.get("role")
        if user_role != required_role.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for {user_role}. {required_role.value} role required."
            )
        return payload
    return role_checker
