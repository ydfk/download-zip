/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 12:48:19
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-29 09:13:59
 */
import { Type, Static } from "@sinclair/typebox";

export enum ZipTypeEnum {
  FILE = "file",
  FOLDER = "folder",
}

const ZipGenerateItemSchema = Type.Recursive(
  (This) =>
    Type.Object({
      name: Type.String(),
      type: Type.Enum(ZipTypeEnum),
      children: Type.Optional(Type.Array(This)),
      download: Type.Optional(Type.String()),
    }),
  { $id: "children" }
);

export const ZipGenerateBodySchema = Type.Object({
  name: Type.String(),
  children: Type.Array(ZipGenerateItemSchema),
});

export const ZipGenerateQuerySchema = Type.Object({
  regenerate: Type.Optional(Type.Boolean()),
});

export const ZipDownloadParamsSchema = Type.Object({
  encrypt: Type.String(),
});

export const ZipGetDownloadByHashSchema = Type.Object({
  hash: Type.String(),
});

export type ZipGenerateBody = Static<typeof ZipGenerateBodySchema>;
export type ZipGenerateQuery = Static<typeof ZipGenerateQuerySchema>;
export type ZipGenerateItem = Static<typeof ZipGenerateItemSchema>;
export type ZipDownloadParams = Static<typeof ZipDownloadParamsSchema>;
export type ZipGetDownloadByHash = Static<typeof ZipGetDownloadByHashSchema>;
