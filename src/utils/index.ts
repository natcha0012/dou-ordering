import * as CryptoJS from 'crypto-js';

export const sha256Encrypt = (
  password: string,
  salt: string,
  iteration: number,
) => {
  let saltedPassword = salt + password;
  for (let i = 0; i < iteration - 1; i++) {
    saltedPassword = CryptoJS.SHA256(saltedPassword).toString(
      CryptoJS.enc.Base64,
    );
  }
  saltedPassword = CryptoJS.SHA256(saltedPassword).toString(
    CryptoJS.enc.Base64,
  );
  return saltedPassword;
};

export const generateSalt = () =>
  CryptoJS.lib.WordArray.random(128 / 8).toString();

export const ThaiDate = (timestamp?: number) => {
  const timest = timestamp ?? Date.now() + 7 * 60 * 60 * 1000;
  const yyyy = new Date(timest).getUTCFullYear();
  const mm = new Date(timest).getUTCMonth() + 1;
  const dd = new Date(timest).getUTCDate();
  return `${yyyy}-${mm.toString().padStart(2, '0')}-${dd
    .toString()
    .padStart(2, '0')}`;
};
