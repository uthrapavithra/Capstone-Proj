import json
from agents import set_trace_processors
from fastapi import BackgroundTasks, Depends, FastAPI, Form, Response,status,Cookie
# from fastapi import FastAPI, Request, UploadFile, File, Form
# import shutil
import os
from fastapi.responses import FileResponse,HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Annotated, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker,Session
# from db import get_db_session
# from file_storage import upload_file,upload_file_resume
# #import psycopg
# from config import settings
# from models import JobBoard,JobPost,JobApplication
from pydantic import BaseModel, Field, field_validator
# from auth import AdminAuthzMiddleware, authenticate_admin , AdminSessionMiddleware, delete_admin_session
# from supabase import create_client, Client
# from emailer import send_email

# from converter import extract_text_from_pdf_bytes
from ai import get_suggestion
# from models import JobApplicationAIEvaluation
from braintrust import init_logger, load_prompt
from braintrust.wrappers.openai import BraintrustTracingProcessor


app = FastAPI()


def load_json_file(file_path):
    """
    Loads a JSON file and returns its data as a Python object.
    Includes error handling for common issues.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)  # Parse JSON into Python dict/list
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {e}")
    except Exception as e:
        raise RuntimeError(f"Error reading file: {e}")



class PlantDetailForm(BaseModel):
   flower_color : str
   flower_posture : str
   bract_type: str
   rosette_present: bool 



@app.post("/api/identify-plants")
#async def get_plant_details():
#async def get_plant_details( flower_color: str,flower_posture: str, bract_type: str,rosette_present: bool ,leaf_features: str,stem_features: str,habitat: str) :
async def get_plant_details(plant_form:Annotated[PlantDetailForm,Form()]) :
    # 
    # "flower_color": "pink to white",
    #     "flower_posture": "upright spikes",
    #     "bract_type": "small scale-like floral bracts along spikes",
    #     "rosette_present": false,
    # 
    file_path = "data.json"
    traits={}
    try:
        json_data = load_json_file(file_path)
        correctness=[]
        for i, species in enumerate(json_data["species"]):
            traits=(species["traits"])
            count =0

            if  plant_form.flower_color in traits["flower_color"]: 
                count +=1
                
            if plant_form.flower_posture in traits["flower_posture"]:
                count +=1
                
            if plant_form.bract_type in traits["bract_type"]:
                count +=1
                
            if plant_form.rosette_present == traits["rosette_present"]: #boolean
                count +=1
            
            correctness.append(count)
            print(count, i)
                
                
        print(correctness)
        max_match = max(correctness)
        index = correctness.index(max_match)
        print(max_match,index)

        species_found = json_data["species"][index]["common_name"]
        species_id = json_data["species"][index]["id"]
        lifecycle_info = json_data["lifecycle_info"][index]
        control_methods = json_data["control_methods"][index]

        return {"species_found":species_found,"lifecycle_info":lifecycle_info,"control_methods":control_methods}


        

    except Exception as e:
        print(e)



class IdentifyWeedForm(BaseModel):
   description : str
   
##identify weed and give suggestions

@app.post("/api/identify-weed")
async def identify_weed(plant_description:Annotated[IdentifyWeedForm,Form()]):
    #return True
    return get_suggestion(plant_description.description)
