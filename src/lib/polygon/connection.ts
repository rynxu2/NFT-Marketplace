export function getPolygonExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  return `https://amoy.polygonscan.com/${type}/${hash}`;
}

export function formatPOL(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18;
}

export function ethToWei(eth: number): bigint {
  return BigInt(Math.round(eth * 1e18));
}
