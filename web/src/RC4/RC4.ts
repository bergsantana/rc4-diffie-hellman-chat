// // const { Buffer } = require('node:buffer')

// import { Buffer } from 'buffer'

// export class RC4 {
//   S: number[]
//   i: number
//   j: number

//   constructor(key: string) {
//     this.S = [];
//     this.i = 0;
//     this.j = 0;
//     this.init(key);
//   }

//   // Key-scheduling algorithm (KSA)
//   init(key: string) {
//     const keyLength = key.length;
//     this.S = Array.from({ length: 256 }, (_, i) => i);

//     let j = 0;
//     for (let i = 0; i < 256; i++) {
//       j = (j + this.S[i] + key.charCodeAt(i % keyLength)) % 256;
//       [this.S[i], this.S[j]] = [this.S[j], this.S[i]]; // Swap S[i] and S[j]
//     }
//   }

//   // Pseudo-random generation algorithm (PRGA)
//   nextByte() {
//     this.i = (this.i + 1) % 256;
//     this.j = (this.j + this.S[this.i]) % 256;
//     [this.S[this.i], this.S[this.j]] = [this.S[this.j], this.S[this.i]]; // Swap S[i] and S[j]

//     return this.S[(this.S[this.i] + this.S[this.j]) % 256];
//   }

//   // Encryption/decryption (same function for RC4)
//   encryptDecrypt(input: string) {
//     const inputBytes = Buffer.from(input, "utf-8");
//     const outputBytes = inputBytes.map((byte : any) => byte ^ this.nextByte());
//     return Buffer.from(outputBytes).toString("hex");
//   }

//   decrypt(ciphertext: string) {
//     const ciphertextBytes = Buffer.from(ciphertext, "hex");
//     const outputBytes = ciphertextBytes.map((byte :any ) => byte ^ this.nextByte());
//     return Buffer.from(outputBytes).toString("utf-8");
//   }
// }
 
export class RC4 {
  private S: number[] = [];
  private key: string;

  constructor(key: string) {
    this.key = key;
    this.initialize();
  }

  // Initialize the permutation array (S) using the key
  private initialize(): void {
    const keyLength = this.key.length;
    this.S = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;

    for (let i = 0; i < 256; i++) {
      j = (j + this.S[i] + this.key.charCodeAt(i % keyLength)) % 256;
      [this.S[i], this.S[j]] = [this.S[j], this.S[i]]; // Swap S[i] and S[j]
    }
  }

  // Generate a pseudo-random byte stream
  private generateKeyStream(length: number): number[] {
    let i = 0,
      j = 0;
    const keyStream: number[] = [];

    for (let k = 0; k < length; k++) {
      i = (i + 1) % 256;
      j = (j + this.S[i]) % 256;
      [this.S[i], this.S[j]] = [this.S[j], this.S[i]]; // Swap S[i] and S[j]
      const t = (this.S[i] + this.S[j]) % 256;
      keyStream.push(this.S[t]);
    }

    return keyStream;
  }

  // Encrypt or decrypt the input text
  public process(input: string): string {
    const inputBytes = Array.from(input).map((char) => char.charCodeAt(0));
    const keyStream = this.generateKeyStream(inputBytes.length);
    const outputBytes = inputBytes.map(
      (byte, index) => byte ^ keyStream[index]
    );

    return String.fromCharCode(...outputBytes);
  }
}
