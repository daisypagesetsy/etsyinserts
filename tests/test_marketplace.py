import unittest
from marketplace import listing_copy, listing_text

class ListingTests(unittest.TestCase):
    def test_supplied_examples_have_current_files_and_thirteen_tags(self):
        for name in ['pink-y2k','moon-book','purple-composition','purple-y2k','blue-composition','bookish-blooming','green-floral']:
            with self.subTest(name=name):
                copy=listing_copy(name)
                self.assertEqual(len(copy['tags']),13)
                self.assertTrue(all(len(t)<=20 for t in copy['tags']))
                self.assertIn('Based on your',copy['source'])
                self.assertIn('Original-art.png',copy['description'])
                self.assertNotIn('Print-A4.pdf',copy['description'])
                self.assertNotIn('Print-Letter.pdf',copy['description'])
                self.assertIn('custom measured dimensions in cm',copy['description'])
    def test_unknown_design_is_labeled_as_template_and_not_ai(self):
        copy=listing_copy('my-new-design','My Shop')
        self.assertIn('My New Design',copy['title']);self.assertEqual(len(copy['tags']),13)
        self.assertIn('Template draft',copy['source']);self.assertIn('Message My Shop',copy['description'])
        self.assertNotIn('butterfly',copy['description'].lower())
    def test_text_matches_uploaded_format(self):
        text=listing_text(listing_copy('moon-book'))
        self.assertTrue(text.startswith('TITLE\nVintage Moon'))
        self.assertIn('\n\nTAGS\n',text);self.assertIn('\n\nDESCRIPTION\n',text)

if __name__=='__main__':unittest.main()
