import base64, io, json, unittest, zipfile
from PIL import Image
from app import bundle, collection

class BundleTests(unittest.TestCase):
    def setUp(self):
        stream=io.BytesIO();Image.new('RGB',(1200,1800),'#668855').save(stream,'PNG');self.art=stream.getvalue()
    def test_complete_bundle_preserves_original_and_reports_quality(self):
        with zipfile.ZipFile(io.BytesIO(bundle(self.art,{'width':100,'height':150,'title':'</script><script>alert(1)</script>'}))) as z:
            self.assertEqual(set(z.namelist()),{'Original-art.png','Read-me.txt','Custom-size.html','Quality-report.json'})
            self.assertEqual(z.read('Original-art.png'),self.art)
            quality=json.loads(z.read('Quality-report.json'));self.assertEqual(quality['effective_dpi'],304.8)
            self.assertFalse(quality['low_resolution'])
            selector=z.read('Custom-size.html').decode();self.assertNotIn('</script><script>alert',selector);self.assertIn('Kobo',selector);self.assertNotIn('PocketBook',selector);self.assertNotIn('Kindle 2007',selector);self.assertIn('Width · cm',selector);self.assertNotIn('__CONFIG__',selector)
    def test_crop_and_contain_have_distinct_effective_dpi(self):
        for mode,expected in [('cover',152.4),('contain',457.2)]:
            with zipfile.ZipFile(io.BytesIO(bundle(self.art,{'width':200,'height':100,'fit':mode}))) as z:
                self.assertEqual(json.loads(z.read('Quality-report.json'))['effective_dpi'],expected)
    def test_invalid_dimensions_rejected(self):
        for opts in [{'width':float('nan')},{'width':0},{'radius':90},{'fit':'stretch'}]:
            with self.subTest(opts=opts),self.assertRaises(ValueError):bundle(self.art,opts)
    def test_collection_keeps_same_named_designs_in_separate_safe_folders(self):
        item={'title':'../same', 'image':base64.b64encode(self.art).decode()}
        with zipfile.ZipFile(io.BytesIO(collection([item,item],{}))) as z:
            self.assertEqual(len(z.namelist()),8)
            self.assertEqual(z.read('01-same/Original-art.png'),self.art)
            self.assertEqual(z.read('02-same/Original-art.png'),self.art)
            self.assertFalse(any(n.endswith('.pdf') or '..' in n for n in z.namelist()))
        for items in [[],[item]*51]:
            with self.assertRaises(ValueError):collection(items,{})
    def test_jpeg_converted_to_source_resolution_png(self):
        source=io.BytesIO();Image.new('RGB',(800,1200),'red').save(source,'JPEG')
        with zipfile.ZipFile(io.BytesIO(bundle(source.getvalue(),{}))) as z:
            image=Image.open(io.BytesIO(z.read('Original-art.png')))
            self.assertEqual(image.format,'PNG');self.assertEqual(image.size,(800,1200))
    def test_large_dimensions_can_export_without_pdf_paper_limit(self):
        with zipfile.ZipFile(io.BytesIO(bundle(self.art,{'width':300,'height':350}))) as z:
            self.assertIn('Custom-size.html',z.namelist())
    def test_invalid_image_rejected(self):
        with self.assertRaises(OSError):bundle(b'not an image',{})

if __name__=='__main__':unittest.main()
