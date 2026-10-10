# Insert Studio
A local web application for producing printable clear-case insert ZIPs, based on the supplied sample format. These are printable products, not e-reader screen files.

## Easy start
Install Python 3.11 or newer once. Then double-click `Run.bat` on Windows or `Start-Mac.command` on Mac. The launcher installs dependencies and opens the browser. Keep its terminal window open while using the app. If macOS does not allow the command to open, use the terminal commands below.

Choose artwork, choose a reader, and select individual ZIPs or one bundle ZIP. The artwork filename becomes its title automatically. Open **Adjust size or details** only when you need measured dimensions, a different crop or shop details. Presets still need a plain-paper fit check.

## Run manually
Python 3.11+:

```sh
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app.py
```

Open the app on port 8000 in your local browser. Upload PNG, JPEG or WebP files, select measured dimensions and download individual ZIPs or one combined ZIP with a folder per artwork. The local server processes uploads in memory. This development server is intended for local use; public hosting needs a production service with request limits and access controls.

## Bundle contents
- Original-art.png: PNG uploads are preserved byte for byte; JPEG/WebP files are converted to PNG at their original resolution.
- No pre-generated PDFs. Print artwork and outline tests from the offline HTML selector.
- Standalone offline HTML selector with a short list: Kindle 2024, Paperwhite 2024, Colorsoft 2024, Kobo Libra Colour, Clara Colour and Clara BW. Custom size supports any other reader, with measurements in centimeters. The creator page uses the same short list and centimeter measurements.
- Printing instructions and JSON quality report.

Presets are sample device body dimensions, not independently verified case templates. All dimensions remain editable. No unsupported dimensions are invented. Cropping preserves aspect ratio; contain mode retains the entire image. Effective DPI is calculated from actual source pixels; no upscaling can guarantee extra detail. Artwork stays at source resolution without additional lossy compression. PNG originals retain their metadata and converted images retain the source ICC profile when present; browser/printer rendering may differ.

A combined bundle supports up to 50 designs and 28 MB total source files. Individual mode accepts files below 28 MB each. Each bundle design has its own folder, even when filenames repeat.

## Validate
```sh
.venv/bin/python -m unittest discover -s tests -v
```

No uploaded sample artwork is included in this repository. Canva artwork can be exported as high-resolution PNG and uploaded manually. No Canva, Sites, Etsy or GitHub publishing integration is configured.

## Seller workspace
After creating customer ZIPs, each artwork gets its own result card on the same page. Customer ZIPs remain separate from seller assets. Download three 2000 × 2000 listing PNGs, an editable PowerPoint for Canva import, and one seller-assets ZIP per design. Artwork in listing layouts is never enlarged above source resolution. Canva import retains separate text and picture objects, but the original artwork stays flattened; check fonts and layout in Canva. This does not create a hosted Canva template link.

The page offers Google Gemini vision copy (title, description, 13 tags, artwork-preview alt text and a social caption). Get an API key from Google AI Studio, then enter it under **Listing copy & AI settings**. It is used only for that browser session and is not saved or included in downloads. Alternatively set `GEMINI_API_KEY` on the machine running the app. A reduced preview and design/shop names are sent to `generativelanguage.googleapis.com`, using `gemini-2.5-flash`; usage is subject to your provider quota and billing. Review generated copy before publishing; no live Etsy keyword research is performed.

If Gemini is unavailable, customer ZIPs and seller images still work. The page marks copy as pending, and the seller ZIP includes `AI-status.txt` rather than invented AI text. Connect a key and use **Regenerate seller assets**, or explicitly select **Basic draft** for a generic non-AI template. Keys are never requested in chat.

Under **Brand colors**, load your banner image or reference ZIP directly from your PC. The app displays the actual banner and samples colors for the page and future listing images. Images should be below 28 MB; ZIPs are limited to 150 MB and must contain exactly one banner PNG/JPEG/WebP with "banner" in its name. Multiple banners require choosing the extracted image. Palette sampling is approximate and can be adjusted. The supplied chat reference ZIP exceeded the chat transfer tool's 32 MiB limit, so its exact assets and typography have not been inspected here. Your PC can load it locally; the cloud default theme is not claimed to match that unseen banner.
