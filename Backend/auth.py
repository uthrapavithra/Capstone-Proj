import secrets

from fastapi import HTTPException, Request,status
from config import settings
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

from database.db import get_db_session
from database.models import User

admin_sessions = {}

def authenticate_user(username, password):

    with get_db_session() as session:
        get_username= session.query(User.username).filter(User.username == username).scalar()

        if get_username:
            get_password = session.query(User.password).filter(User.username == username).scalar()

            print(get_username,get_password)

            if get_password is None:
                raise HTTPException(status_code=400, detail="Entered wrong password")


        else:
            raise HTTPException(status_code=400, detail="Enter wrong username")



    correct_username = secrets.compare_digest(username, get_username)
    correct_password = secrets.compare_digest(password, get_password)
    
    if correct_username and correct_password:
        token = secrets.token_hex(16) 
        admin_sessions[token] = True
        return token
    else:
        #admin_sessions.clear()
        return None

def is_admin(admin_session_token):
    return admin_session_token in admin_sessions

def delete_admin_session(token):
    del admin_sessions[token]

class AdminSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self,request: Request,handler):
        admin_session_token = request.cookies.get("admin_session")
        print("session token----",admin_sessions ,"---",admin_session_token)
        request.state.is_admin = admin_session_token in admin_sessions
        #print(request.state.is_admin)
        response = await handler(request)
        return response

class AdminAuthzMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, handler):
        # print("request--",request.method ,"----",request.url.path)
        # print(hasattr(request.state,"is_admin"))
        # print(request.state.is_admin)
        if request.method != 'GET' and 'identify-weed' in request.url.path and (not hasattr(request.state,"is_admin") or not request.state.is_admin):
            return JSONResponse({},status_code=status.HTTP_401_UNAUTHORIZED)

        response = await handler(request)
        #print(response)

        return response