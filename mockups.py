"""Local watermarked listing previews using a reusable generated photo template."""
import io
import warnings
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).parent
# Coordinates are relative to the generated template; calibrated after inspection.
ART_BOUNDS=(356/1254,207/1254,907/1254,1002/1254)


def face(size,bold=False):
    for name in (['DejaVuSans-Bold.ttf','arialbd.ttf'] if bold else ['DejaVuSans.ttf','arial.ttf']):
        try:return ImageFont.truetype(name,size)
        except OSError:pass
    return ImageFont.load_default(size=size)


def listing_mockup(data,options):
    template=ROOT/'web/mockup-template.png'
    if not template.exists():raise ValueError('Mockup template is missing. Download the latest full app ZIP.')
    with warnings.catch_warnings():
        warnings.simplefilter('error',Image.DecompressionBombWarning)
        raw=Image.open(io.BytesIO(data))
        if raw.format not in ('PNG','JPEG','WEBP'):raise ValueError('Use PNG, JPEG or WebP artwork.')
        raw.load();art=ImageOps.exif_transpose(raw).convert('RGBA')
    photo=Image.open(template).convert('RGBA');pw,ph=photo.size
    left,top,right,bottom=[round(n*(pw if i%2==0 else ph)) for i,n in enumerate(ART_BOUNDS)]
    width,height=right-left,bottom-top
    if options.get('fit','cover')=='contain':
        insert=Image.new('RGBA',(width,height),'#fffdf8');fitted=ImageOps.contain(art,(width,height),Image.Resampling.LANCZOS);insert.alpha_composite(fitted,((width-fitted.width)//2,(height-fitted.height)//2))
    else:
        insert=ImageOps.fit(art,(width,height),Image.Resampling.LANCZOS)
    # Repeated translucent marks cover the design itself, not just the image border.
    shop=str(options.get('shop','BookishDaisy')).strip()[:40] or 'BookishDaisy'
    marks=Image.new('RGBA',(width,height));draw=ImageDraw.Draw(marks);font=face(max(14,width//18),True)
    for y in range(height//8,height,max(60,height//4)):
        for x in range(-width//8,width,max(100,width//2)):
            draw.text((x,y),shop,font=font,fill=(255,255,255,100),stroke_width=1,stroke_fill=(53,32,78,65))
    insert=Image.alpha_composite(insert,marks)
    mask=Image.new('L',(width,height));ImageDraw.Draw(mask).rounded_rectangle((0,0,width-1,height-1),radius=max(5,round(width*.06)),fill=255)
    photo.paste(insert,(left,top),mask)
    draw=ImageDraw.Draw(photo)
    # Simple cream/lavender label keeps the listing image aligned to the shop theme.
    pad=round(pw*.045);label_height=round(ph*.12)
    draw.rounded_rectangle((pad,ph-label_height-pad,pw-pad,ph-pad),radius=round(pw*.02),fill='#f8f3e9',outline='#80669b',width=2)
    heading=face(round(pw*.034),True);small=face(round(pw*.019))
    draw.text((pw/2,ph-label_height-pad+label_height*.27),shop,anchor='mm',font=heading,fill='#35204e')
    draw.text((pw/2,ph-label_height-pad+label_height*.7),'PRINTABLE INSERT · DIGITAL DOWNLOAD · STYLED MOCKUP',anchor='mm',font=small,fill='#685479')
    output=io.BytesIO();photo.convert('RGB').save(output,'PNG');return output.getvalue()
