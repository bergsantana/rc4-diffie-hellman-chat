export function isPrime(num: number) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;

  let i = 5;
  while (i * i <= num) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
    i += 6;
  }
  return true;
}

export function generatePrimeNumber(min: number, max: number) {
  let prime = 0;
  while (!isPrime(prime)) {
    prime = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return prime;
}

export const generateInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + 1);
};
