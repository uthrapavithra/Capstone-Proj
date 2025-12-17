

import json
from fastapi import BackgroundTasks, Depends, FastAPI, Form, Request, Response,status,Cookie
from datetime import datetime
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from typing import Annotated, Optional
from db import get_db_session
from file_storage import upload_file,image_to_data_url
import psycopg
from config import settings
from models import AddQuery, User
from pydantic import BaseModel, EmailStr, Field, field_validator
from auth import AdminAuthzMiddleware, authenticate_user , AdminSessionMiddleware, delete_admin_session
from ai import get_suggestion
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Query

app = FastAPI()
app.add_middleware(AdminAuthzMiddleware)
app.add_middleware(AdminSessionMiddleware)
##UPLOAD
app.mount("/uploads", StaticFiles(directory="uploads/images"))



class IdentifyWeedForm(BaseModel):
   description : str
   concern :str
   image: Optional[UploadFile] = None
   
##identify weed and give suggestions

@app.post("/api/identify-weed")
async def identify_weed(
    description: Annotated[str, Form()],
    concern: Annotated[str, Form()],
    image: Annotated[Optional[UploadFile], File()] = None,):
    print("inside fast api")
    image_url = None

    print(image)

    if image is not None:
        image_url = image_to_data_url(image)
        # image_contents = await image.read()
        # image_upload = upload_file("images",image.filename,image_contents,image.content_type)
    
    #print("url----",image_url)
    response = get_suggestion(description,concern,image_url)

    res= json.loads(response)

    conf_score = round((res["confidence_score"]*100),1)
    print(conf_score)

    res["confidence_score"]=conf_score

    result = json.dumps(res)

    return result

class AddWeedData(BaseModel):
   description : str
   concern :str
   image: Optional[UploadFile] = None
   confidence_score: str
   summary: str

@app.post("/api/add-query/{username}")
async def add_query(username:str,data:Annotated[AddWeedData,Form()]):

    with get_db_session() as session:

        
        now = datetime.now()
        created_at = now.strftime("%Y-%m-%d %H:%M:%S")
        if (data.confidence_score):
            conf_score = str(data.confidence_score)+"%"

        else:
            conf_score = "null"



        image = data.image

        if image is not None:
            image_contents = await image.read()
            image_upload_path = upload_file("images",image.filename,image_contents,image.content_type)
        else:
            image_upload_path = "No image"

        add_data = AddQuery(
            user_username = username,
            created_at = created_at,
               question= data.description,
               concern=data.concern,
               image_url=image_upload_path,
               answer_summary=data.summary,
               confidence_score=conf_score
               )
        
        session.add(add_data)
        session.commit()
        session.refresh(add_data)

    return {"Data is added"}

@app.get("/api/past-query/{username}")
async def get_past_query(username:str):


    with get_db_session() as session:
        pastQueries = session.query(AddQuery) \
        .filter(AddQuery.user_username == username) \
        .all()

       
    
    return pastQueries


class Login(BaseModel):
   username : str
   password :str


@app.post("/api/login")
async def login(response:Response,login:Annotated[Login,Form()]):
    auth_response = authenticate_user(login.username, login.password)
    if auth_response is not None:
        secure = settings.PRODUCTION
        response.set_cookie(key="admin_session", value=auth_response, httponly=True, secure=secure, samesite="lax")
        #print(Cookie(None))
        return {response}
    else:
        
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

@app.post("/api/logout")
async def user_logout(request:Request,response: Response):

    delete_admin_session(request.cookies.get("admin_session"))
    secure=settings.PRODUCTION
    response.delete_cookie(key="admin_session",httponly=True,secure=secure,samesite="lax")
    return {}



class SignUp(BaseModel):
#    id : int
   fullname : str 
   email : EmailStr
   username : str = Field (min_length=6,max_length=20)
   password :str = Field (min_length=6,max_length=20)
   
#    @field_validator("password")
#    @classmethod
#    def validate_password(cls, v: str) -> str:
#     if len(v) < 8 or len(v) > 64:
#         raise ValueError("Password must be 8 to 64 characters long.")
#     if " " in v:
#         raise ValueError("Password must not contain spaces.")
#     if not re.search(r"[a-z]", v):
#         raise ValueError("Password must include at least one lowercase letter.")
#     if not re.search(r"[A-Z]", v):
#         raise ValueError("Password must include at least one uppercase letter.")
#     if not re.search(r"\d", v):
#         raise ValueError("Password must include at least one digit.")
#     if not re.search(r"[^\w\s]", v):  # special char
#         raise ValueError("Password must include at least one special character.")
#     return v

@app.post("/api/sign-up")
async def signup(signup:Annotated[SignUp,Form()]):
    try:
        with get_db_session() as session:
            
            new_user = User(
                fullname= signup.fullname,
                email=signup.email,
                username=signup.username,
                password=signup.password
                )

            session.add(new_user)
            session.commit()
            session.refresh(new_user)

    except IntegrityError as e:
        if isinstance(e.orig, psycopg.errors.UniqueViolation):
            # You can inspect e.orig.diag.constraint_name if you want
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "field": "username",
                    "message": "Username already exists. Please choose another one.",
                },
            )

        # For other DB errors, re-raise or wrap generically
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating user.",
        )


    return {"User added"}

@app.get("/api/me")
async def me(req:Request):
    return {"is_admin": req.state.is_admin}