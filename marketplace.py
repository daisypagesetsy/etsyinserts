"""API-free listing drafts based on the user's BookishDaisy examples."""
import json
import re
from pathlib import Path

EXAMPLES=json.loads((Path(__file__).parent/'listing-examples.json').read_text())
BASE_TAGS=['kindle insert','printable insert','digital download','book lover gift','ereader insert','clear case decor','bookish accessory','kindle decoration','custom size insert']


def slug(text):
    return re.sub(r'[^a-z0-9]+','-',text.lower()).strip('-')


def listing_copy(title,shop='BookishDaisy'):
    name=re.sub(r'[_-]+',' ',str(title)).strip()[:100] or 'Bookish Design'
    key=slug(name)
    matched=next((example for example in EXAMPLES if key==example or key==example.replace('-','') or example in key),None)
    if matched:
        copy={**EXAMPLES[matched],'tags':EXAMPLES[matched]['tags'].copy()}
        copy['description']=copy['description'].replace('BookishDaisy',shop)
        return {**copy,'source':'Based on your '+matched.replace('-',' ')+' example'}
    display=name.title()
    tags=BASE_TAGS.copy()
    # Only use labels the uploader supplied, never invent motifs from unseen pixels.
    for word in slug(name).split('-'):
        if word in {'pink','purple','blue','green','floral','moon','pastel','vintage','retro','y2k','botanical','butterfly'}:
            tag=word+' kindle insert'
            if len(tag)<=20 and tag not in tags:tags.append(tag)
    for tag in ['custom case decor','bookish printable','reader decoration','printable case art']:
        if tag not in tags:tags.append(tag)
    copy={'title':f'{display} Kindle & Kobo Insert, Printable Clear Case Decor'[:140], 'tags':tags[:13],
          'description':f'''Give your reading days a {name.lower()} refresh. This printable Kindle and Kobo insert features the {display} artwork shown in the listing photos, ready to print and trim for your clear case.

DIGITAL DOWNLOAD ONLY
No physical insert, reader, case or other accessory is included.

YOU WILL RECEIVE
One ZIP containing Original-art.png, Custom-size.html, Read-me.txt and Quality-report.json. The offline HTML selector offers six Kindle and Kobo presets plus custom measured dimensions in cm. No PDF files are included.

PLEASE CHECK YOUR FIT
Measure the flat usable area inside your clear case before printing. Presets are device outlines, not physically tested case templates. Open the extracted HTML file in a desktop browser to adjust width, height and corners. Other models require your measurements. Artwork crops to fill different proportions unless you choose to keep the entire image.

HOW TO USE
Download and extract the ZIP. Open Custom-size.html and print a plain-paper outline test at 100% / Actual size, with Fit to page turned off. Check the 5 cm calibration line and both dimensions. Print the artwork, carefully trim and place it inside your compatible clear case.

GOOD TO KNOW
This is flattened artwork. Printer, paper and screen colors vary. Larger sizes may show less detail. Personal use only; do not resell or redistribute the files. Kindle and Kobo names identify devices; {shop} is independent of Amazon and Rakuten Kobo.

NEED HELP?
Message {shop} on Etsy with your reader model and measured case dimensions.'''}
    return {**copy,'source':'Template draft from your design name — review before posting'}


def bundle_listing_copy(title, designs, shop='BookishDaisy'):
    if not isinstance(designs,list) or not 1 <= len(designs) <= 50 or any(not isinstance(name,str) or not name.strip() for name in designs):
        raise ValueError('A bundle listing needs between 1 and 50 design names.')
    names=[re.sub(r'[_-]+',' ',name).strip()[:100] for name in designs]
    display=re.sub(r'[_-]+',' ',str(title)).strip()[:100] or 'Bookish Insert Collection'
    copy=listing_copy('Bookish Insert Collection',shop)
    copy['title']=f'{display} | {len(names)} Printable Kindle & Kobo Inserts, Digital Bundle'[:140]
    copy['tags']=BASE_TAGS+['kindle insert bundle','kobo insert bundle','bookish bundle','reader insert set']
    description=copy['description']
    intro_end=description.index('\n\nDIGITAL DOWNLOAD ONLY')
    description=f"Refresh your reading days with {display}. This digital bundle includes {len(names)} printable reader insert designs for your clear case.\n\nINCLUDED DESIGNS\n"+'\n'.join('- '+name for name in names)+description[intro_end:]
    description=description.replace('One ZIP containing Original-art.png, Custom-size.html, Read-me.txt and Quality-report.json.',f'One ZIP containing {len(names)} separate design folders. Each folder includes Original-art.png, Custom-size.html, Read-me.txt and Quality-report.json.')
    description=description.replace('Open Custom-size.html and print','Open Custom-size.html inside the folder for your chosen design and print')
    copy['description']=description;copy['source']='One listing for the entire bundle — review before posting'
    return copy


def listing_text(copy):
    return f"TITLE\n{copy['title']}\n\nTAGS\n{', '.join(copy['tags'])}\n\nDESCRIPTION\n{copy['description']}\n"
