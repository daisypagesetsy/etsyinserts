import io
import unittest
from PIL import Image, ImageChops
from mockups import listing_mockup

class MockupTests(unittest.TestCase):
    def art(self,color):
        stream=io.BytesIO();Image.new('RGB',(600,900),color).save(stream,'PNG');return stream.getvalue()
    def test_different_art_changes_reader_but_keeps_scene(self):
        a=Image.open(io.BytesIO(listing_mockup(self.art('red'),{})))
        b=Image.open(io.BytesIO(listing_mockup(self.art('blue'),{})))
        self.assertEqual(a.size,(1254,1254));self.assertEqual(a.format,'PNG')
        self.assertEqual(a.getpixel((50,50)),b.getpixel((50,50)))
        self.assertNotEqual(a.getpixel((600,500)),b.getpixel((600,500)))
    def test_watermark_varies_with_shop_and_modes_work(self):
        data=self.art('green')
        a=Image.open(io.BytesIO(listing_mockup(data,{'shop':'BookishDaisy'})))
        b=Image.open(io.BytesIO(listing_mockup(data,{'shop':'My Other Shop','fit':'contain'})))
        self.assertIsNotNone(ImageChops.difference(a,b).getbbox())
        self.assertTrue(listing_mockup(data,{'fit':'contain'}).startswith(b'\x89PNG'))
    def test_invalid_image_is_rejected(self):
        with self.assertRaises(OSError):listing_mockup(b'not an image',{})

if __name__=='__main__':unittest.main()
