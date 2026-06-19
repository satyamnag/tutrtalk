declare module 'sentiment' {
    class Sentiment {
      analyze(text: string): {
        score: number;
        comparative: number;
        tokens: string[];
        words: string[];
        positive: string[];
        negative: string[];
      };
    }
    export = Sentiment;
  }