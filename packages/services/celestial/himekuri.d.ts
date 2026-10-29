declare module "himekuri/旧暦.js" {
  export function 旧暦計算(date: readonly number[]): {
    年: number;
    月: number;
    日: number;
    閏: boolean;
  };
}
