from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image
import io
import uuid



subServer = FastAPI()

active_qrs = {}

@subServer.get("/sub-server/generate-qr")
def generate_qr():
    token = str(uuid.uuid4())
    expire_time = datetime.utcnow() + timedelta(minutes=5)
    active_qrs[token] = expire_time

    
    background = Image.open("back.jpg").convert("RGBA")
    logo = Image.open("logo.jpg").convert("RGBA")

    # Генерация QR с закруглёнными модулями
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H
    )
    qr.add_data(token)
    qr.make(fit=True)

    img_qr = qr.make_image(
        image_factory=StyledPilImage,
        color_mask=SolidFillColorMask(back_color=(255,255,255), front_color=(0,0,0))
    )


    img_qr = img_qr.resize(background.size, Image.Resampling.LANCZOS)
    
    logo_size = int(img_qr.size[0] * 0.2)
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    
    pos = ((img_qr.size[0] - logo_size) // 2, (img_qr.size[1] - logo_size) // 2)
    img_qr.paste(logo, pos, logo)

   
    background = background.resize(img_qr.size)
    combined = Image.alpha_composite(background, img_qr)

    
    buf = io.BytesIO()
    combined.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@subServer.post("/sub-server/check-qr")
def checkQR(request: Request):
    data = request.get()