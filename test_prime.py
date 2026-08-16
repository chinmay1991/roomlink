import unittest

from prime import is_prime


class TestIsPrime(unittest.TestCase):
    def test_negative_numbers(self):
        self.assertFalse(is_prime(-5))
        self.assertFalse(is_prime(-1))

    def test_zero_and_one(self):
        self.assertFalse(is_prime(0))
        self.assertFalse(is_prime(1))

    def test_small_primes(self):
        for n in (2, 3, 5, 7, 11, 13):
            self.assertTrue(is_prime(n), f"{n} should be prime")

    def test_small_composites(self):
        for n in (4, 6, 8, 9, 10, 12):
            self.assertFalse(is_prime(n), f"{n} should not be prime")

    def test_larger_prime(self):
        self.assertTrue(is_prime(97))
        self.assertTrue(is_prime(7919))

    def test_larger_composite(self):
        self.assertFalse(is_prime(100))
        self.assertFalse(is_prime(7921))  # 89 * 89

    def test_even_numbers_are_not_prime(self):
        for n in (100, 200, 300):
            self.assertFalse(is_prime(n))


if __name__ == "__main__":
    unittest.main()
