"""Local printable insert studio. Uploads are processed in memory, never retained."""
import base64, io, json, math, re, warnings, zipfile
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from PIL import Image, ImageOps

ROOT = Path(__file__).parent
LIMIT = 40 * 1024 * 1024
MODELS = json.loads((ROOT / 'web/models.json').read_text())
# The app and exported HTML share the same short reader list.
CUSTOMER_MODELS = MODELS

def dimensions(options):
    w, h, r = (float(options.get(k, v)) for k, v in [('width',108.6),('height',157.8),('radius',0)])
    if not all(math.isfinite(n) for n in (w,h,r)) or not (30 <= w <= 400 and 30 <= h <= 400 and 0 <= r <= min(30,w/2,h/2)):
        raise ValueError('Use dimensions from 30–400 mm and a valid corner radius.')
    return w,h,r

def bundle(data, options):
    w,h,r=dimensions(options); fit=options.get('fit','cover')
    if fit not in ('cover','contain'): raise ValueError('Invalid crop mode.')
    title=str(options.get('title','My insert'))[:100]; shop=str(options.get('shop','Insert Studio'))[:100]
    with warnings.catch_warnings():
        warnings.simplefilter('error',Image.DecompressionBombWarning)
        raw=Image.open(io.BytesIO(data))
        if raw.format not in ('PNG','JPEG','WEBP'): raise ValueError('Upload PNG, JPEG or WebP artwork.')
        is_png = raw.format == 'PNG'
        raw.load(); image=ImageOps.exif_transpose(raw).convert('RGBA')
    iw,ih=image.size
    dpi=(min if fit=='cover' else max)(iw/(w/25.4),ih/(h/25.4))
    normalized=io.BytesIO(); image.save(normalized,format='PNG',icc_profile=raw.info.get('icc_profile'))
    original_png = data if is_png else normalized.getvalue()
    template=(ROOT/'web/selector.html').read_text()
    config=dict(title=title,shop=shop,width=w,height=h,radius=r,fit=fit,models=CUSTOMER_MODELS,pixels=[iw,ih])
    safe=json.dumps(config).replace('<','\\u003c')
    selector=template.replace('__CONFIG__',safe).replace('__IMAGE__',base64.b64encode(normalized.getvalue()).decode())
    readme=f'''{shop} | {title}
PRINTABLE CLEAR-CASE INSERTS — not a file to send to an e-reader screen.

Extract the ZIP. Open Custom-size.html in a desktop browser, offline.
Choose a listed Kindle or Kobo model, or Custom size for any other reader.
Enter your measured case dimensions in centimeters (cm).
Sample presets are device body outlines from the supplied sample, not verified case templates.
Use the HTML tool to print the artwork or an ink-saving outline test.
Print at 100% / actual size. Disable fit-to-page, margins, headers and footers.
Check the 50 mm ruler AND the insert width and height. Test on plain paper first.
Trim corners and button/port openings to your actual case.

Source: {iw} x {ih} pixels. Effective print resolution: {dpi:.0f} DPI at {w} x {h} mm ({fit}).
300 DPI is a useful print target. No artificial upscaling or JPEG recompression is applied.
Original-art.png keeps uploaded PNG bytes unchanged; JPEG/WebP inputs are converted
to PNG at source resolution, with no additional lossy compression.
Colors depend on the source profile, browser, printer and paper. No guaranteed color match.
The HTML supports A4, Letter and A3 printing. No PDF files are included.
Device names identify intended categories; no manufacturer affiliation or tested fit is implied.
'''
    output=io.BytesIO()
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('Original-art.png',original_png); z.writestr('Custom-size.html',selector); z.writestr('Read-me.txt',readme)
        z.writestr('Quality-report.json',json.dumps(dict(pixels=[iw,ih],effective_dpi=round(dpi,1),target_dpi=300,low_resolution=dpi<300,width_mm=w,height_mm=h,fit=fit),indent=2))
    return output.getvalue()

def collection(items, options):
    if not isinstance(items, list) or not 1 <= len(items) <= 50:
        raise ValueError('Choose between 1 and 50 artworks per bundle.')
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as combined:
        for index, item in enumerate(items, 1):
            title = str(item.get('title', 'Artwork'))[:100]
            folder = f"{index:02d}-" + (re.sub(r'[^a-zA-Z0-9_-]+', '-', title).strip('-') or 'artwork')
            data = base64.b64decode(item['image'], validate=True)
            with zipfile.ZipFile(io.BytesIO(bundle(data, {**options, 'title': title}))) as individual:
                for name in individual.namelist():
                    combined.writestr(folder + '/' + name, individual.read(name))
    return output.getvalue()

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        files={'/':'index.html','/studio.js':'studio.js','/style.css':'style.css','/models.json':'models.json'}
        if self.path=='/health': self.send(200,b'ok','text/plain'); return
        name=files.get(self.path)
        if not name: self.send(404,b'Not found','text/plain'); return
        mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'}[Path(name).suffix]
        self.send(200,(ROOT/'web'/name).read_bytes(),mime)
    def send(self,status,data,mime):
        self.send_response(status); self.send_header('Content-Type',mime); self.send_header('Content-Length',str(len(data))); self.send_header('X-Content-Type-Options','nosniff'); self.end_headers(); self.wfile.write(data)
    def do_POST(self):
        if self.path not in ('/api/bundle', '/api/collection'): self.send(404,b'Not found','text/plain'); return
        try:
            n=int(self.headers.get('Content-Length','0'))
            if not 0<n<=LIMIT: raise ValueError('Upload request must be below 40 MB.')
            request=json.loads(self.rfile.read(n))
            options=request.get('options', {})
            if self.path == '/api/collection':
                result=collection(request['items'], options)
            else:
                data=base64.b64decode(request['image'],validate=True)
                result=bundle(data, options)
            self.send(200,result,'application/zip')
        except (ValueError,KeyError,TypeError,AttributeError,OSError,Image.DecompressionBombError,Image.DecompressionBombWarning) as e:
            self.send(400,json.dumps({'error':str(e)}).encode(),'application/json')

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser(); p.add_argument('--host',default='127.0.0.1'); p.add_argument('--port',type=int,default=8000); p.add_argument('--open-browser',action='store_true'); args=p.parse_args()
    server=ThreadingHTTPServer((args.host,args.port),Handler)
    print(f'Insert Studio is running on http://{args.host}:{args.port}. Keep this window open; press Ctrl+C to stop.',flush=True)
    if args.open_browser:
        import webbrowser
        webbrowser.open(f'http://{args.host}:{args.port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
