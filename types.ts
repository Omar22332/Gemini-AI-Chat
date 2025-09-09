export type MessagePart =
  | {
      text: string;
    }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
  groundingChunks?: GroundingChunk[];
}
