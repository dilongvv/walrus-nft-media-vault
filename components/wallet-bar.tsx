'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Network, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWalletNetwork } from '@/hooks/useWalletNetwork';
import { truncateAddress } from '@/lib/utils';

export function WalletBar() {
  const account = useCurrentAccount();
  const { network, switchNetwork, supportedNetworks } = useWalletNetwork();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="flex h-10 items-center rounded-md border border-white/10 bg-white/5 p-1">
        {supportedNetworks.map((item) => (
          <Button
            key={item}
            type="button"
            variant={network === item ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchNetwork(item)}
            className="h-8"
          >
            <Network className="h-4 w-4" />
            {item}
          </Button>
        ))}
      </div>
      <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
        {account?.address ? truncateAddress(account.address) : 'No wallet'}
      </div>
      <div className="wallet-connect">
        <ConnectButton connectText="Connect Wallet" />
      </div>
      {account?.address ? <Power className="h-4 w-4 text-primary" /> : null}
    </div>
  );
}
