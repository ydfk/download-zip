/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 22:22:48
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-28 18:21:36
 */
import { AES_KEY, AES_IV } from "constant";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

export const generateMD5 = (data: string): string => {
  const hash = createHash("md5");
  hash.update(data);
  return hash.digest("hex");
};

export const generateAes = () => {
  const key = randomBytes(32); // 256位密钥
  const iv = randomBytes(16); // 128位IV
  return {
    key: key.toString("base64"),
    iv: iv.toString("base64"),
  };
};

export const aesEncrypt = (plainText: string) => {
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(AES_KEY, "base64"), Buffer.from(AES_IV, "base64"));
  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

export const aesDecrypt = (encrypted: string) => {
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(AES_KEY, "base64"), Buffer.from(AES_IV, "base64"));
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
