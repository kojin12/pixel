
from PIL import image, ImageDraw
import os
import segno

current_dir = os.path.dirname(os.path.abspath(__file__))
logoPath = os.path.join(current_dir, "logo.jpg")
logoPath = os.path.abspath(logoPath)

def createQR(data):
    URL = f"/sub-server/autorization/{data["userID"]}/{data[{"password"}]}"
    
        