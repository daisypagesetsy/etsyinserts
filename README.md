# Insert Studio
A local web application for producing printable clear-case insert ZIPs, based on the supplied sample format. These are printable products, not e-reader screen files.

## Easy start
Install Python 3.11 or newer once. Then double-click `Run.bat` on Windows or `Start-Mac.command` on Mac. The launcher installs dependencies and opens the browser. Keep its terminal window open while using the app. If macOS does not allow the command to open, use the terminal commands below.

Choose artwork, choose a reader, and create a ZIP. The artwork filename becomes its title automatically. Open **Adjust size or details** only when you need measured dimensions, a different crop or shop details. Presets still need a plain-paper fit check.

## Run manually
Python 3.11+:

```sh
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app.py
```

Open the app on port 8000 in your local browser. Upload PNG, JPEG or WebP files, select measured dimensions and download a ZIP per artwork. The local server processes uploads in memory. This development server is intended for local use; public hosting needs a production service with request limits and access controls.

## Bundle contents
- Original artwork, with exact uploaded bytes preserved.
- A4 and US Letter PDFs, artwork plus outline-test pages.
- Standalone offline HTML selector with a short list: Kindle 2024, Paperwhite 2024, Colorsoft 2024, Kobo Libra Colour, Clara Colour and Clara BW. Custom size supports any other reader, with measurements in centimeters. The creator interface retains the full catalogue.
- Printing instructions and JSON quality report.

Presets are sample device body dimensions, not independently verified case templates. All dimensions remain editable. No unsupported dimensions are invented. Cropping preserves aspect ratio; contain mode retains the entire image. Effective DPI is calculated from actual source pixels; no upscaling can guarantee extra detail. PDFs embed source-resolution artwork without JPEG recompression. Original color profiles remain in the original file; browser/printer rendering may differ.

## Validate
```sh
.venv/bin/python -m unittest discover -s tests -v
```

No uploaded sample artwork is included in this repository. Canva artwork can be exported as high-resolution PNG and uploaded manually. No Canva, Sites, Etsy or GitHub publishing integration is configured.
