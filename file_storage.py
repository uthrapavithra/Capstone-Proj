

from config import settings
import os
from PIL import Image
import base64
import io
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query

UPLOAD_DIR = "uploads"


# supabase: Client = create_client(str(settings.SUPABASE_URL), settings.SUPABASE_KEY)

def upload_file(bucket_name, path, contents, content_type):

  os.makedirs(f"{UPLOAD_DIR}/{bucket_name}",exist_ok=True)
  file_path=os.path.join(UPLOAD_DIR,bucket_name,path)
  print(file_path)
  with open(file_path,"wb") as f:

      f.write(contents)

  return f"/{UPLOAD_DIR}/{path}"
  
def image_to_data_url(upload) -> str:
    """
    Validates the upload is an image, re-encodes to PNG in-memory (safe/consistent),
    and returns a data URL that can be sent to the OpenAI API.
    """
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    raw = upload.file.read()
    #print("raw---",raw)
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse image.")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"