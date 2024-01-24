/**
 * A copy from https://github.com/ton-community/gamefi-sdk/blob/ada116fa51861c2a137eecc119955bcab1c82c3d/src/nft/content.ts
 * Don't change the file
 */

// No check is necessary because current repo has more strict TypeScript settings
// @ts-nocheck

import {Dictionary} from '@ton/core';
import z from 'zod';
import {
  DecodedContent,
  ParsedContent,
  decodeSimpleFields,
  decodeImage,
  bufferToStr
} from './content';

export interface NftContent {
  uri?: string;
  name?: string;
  description?: string;
  image?: string;
  imageData?: Buffer;
}

export function nftContentToInternal(content: NftContent) {
  return {
    uri: content.uri,
    name: content.name,
    description: content.description,
    image: content.image,
    image_data: content.imageData?.toString('base64')
  };
}

export type ParsedNftContent = {
  name?: string;
  description?: string;
  image?: string | Buffer;
};

export function parseNftContent(dc: DecodedContent): ParsedContent<ParsedNftContent> {
  const decoded: ParsedNftContent = decodeSimpleFields(dc, {
    name: {
      onchain: bufferToStr,
      offchain: (v: unknown) => z.string().parse(v)
    },
    description: {
      onchain: bufferToStr,
      offchain: (v: unknown) => z.string().parse(v)
    }
  });
  decoded.image = decodeImage(dc);
  const out: ParsedContent<ParsedNftContent> = {
    ...decoded,
    type: dc.type,
    unknownOffchainFields: dc.offchainFields ?? {},
    unknownOnchainFields: dc.onchainFields ?? Dictionary.empty(),
    offchainUrl: dc.offchainUrl
  };
  return out;
}
