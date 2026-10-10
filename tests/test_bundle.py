import base64, io, json, unittest, zipfile
from PIL import Image
from app import bundle

class BundleTests(unittest.TestCase):
    def setUp(self):
        stream=io.BytesIO();Image.new('RGB',(1200,1800),'#668855').save(stream,'PNG');self.art=stream.getvalue()
    def test_complete_bundle_preserves_original_and_reports_quality(self):
        with zipfile.ZipFile(io.BytesIO(bundle(self.art,{'width':100,'height':150,'title':'</script><script>alert(1)</script>'}))) as z:
            self.assertEqual(set(z.namelist()),{'Original-art.png','Read-me.txt','Custom-size.html','Print-A4.pdf','Print-Letter.pdf','Quality-report.json'})
            self.assertEqual(z.read('Original-art.png'),self.art)
            quality=json.loads(z.read('Quality-report.json'));self.assertEqual(quality['effective_dpi'],304.8)
            self.assertFalse(quality['low_resolution'])
            for name in ['Print-A4.pdf','Print-Letter.pdf']:
                data=z.read(name);self.assertTrue(data.startswith(b'%PDF'));self.assertIn(b'/Count 2',data)
            selector=z.read('Custom-size.html').decode();self.assertNotIn('</script><script>alert',selector);self.assertIn('Kobo',selector);self.assertNotIn('PocketBook',selector);self.assertNotIn('Kindle 2007',selector);self.assertIn('Width · cm',selector);self.assertNotIn('__CONFIG__',selector)
    def test_crop_and_contain_have_distinct_effective_dpi(self):
        for mode,expected in [('cover',152.4),('contain',457.2)]:
            with zipfile.ZipFile(io.BytesIO(bundle(self.art,{'width':200,'height':100,'fit':mode}))) as z:
                self.assertEqual(json.loads(z.read('Quality-report.json'))['effective_dpi'],expected)
    def test_invalid_dimensions_and_oversize_paper_rejected(self):
        for opts in [{'width':float('nan')},{'width':0},{'radius':90},{'width':300,'height':350},{'fit':'stretch'}]:
            with self.subTest(opts=opts),self.assertRaises(ValueError):bundle(self.art,opts)
    def test_invalid_image_rejected(self):
        with self.assertRaises(OSError):bundle(b'not an image',{})

if __name__=='__main__':unittest.main()
