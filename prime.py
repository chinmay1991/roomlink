def is_prime(n):
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False
    i = 3
    while i * i <= n:
        if n % i == 0:
            return False
        i += 2
    return True


if __name__ == "__main__":
    num = int(input("Enter a number: "))
    if is_prime(num):
        print(f"{num} is a prime number")
    else:
        print(f"{num} is not a prime number")
