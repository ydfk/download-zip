/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 22:22:48
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-24 22:23:50
 */
import { createHash } from "crypto";

export const generateMD5 = (data: string): string => {
  const hash = createHash("md5");
  hash.update(data);
  return hash.digest("hex");
};
