function fib(a) {
  if (a == 1) {
    return 0;
  }

  if (a == 2) {
    return 1;
  }

  return fib(a-1) + fib(a-2);
}

print(fib(15));
