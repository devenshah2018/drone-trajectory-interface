declare module "google-trends-api" {
  interface InterestOverTimeOptions {
    keyword: string;
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
  }

  interface InterestByRegionOptions {
    keyword: string;
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    resolution?: "COUNTRY" | "REGION" | "CITY" | "DMA";
    hl?: string;
    timezone?: number;
    category?: number;
  }

  function interestOverTime(
    options: InterestOverTimeOptions
  ): Promise<string | object>;
  function interestByRegion(
    options: InterestByRegionOptions
  ): Promise<string | object>;

  const _default: {
    interestOverTime: typeof interestOverTime;
    interestByRegion: typeof interestByRegion;
  };
  export default _default;
}
