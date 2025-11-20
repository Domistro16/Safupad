import { useReadContract } from 'wagmi';
import { constants } from '../constants';
import { useMemo } from 'react';

interface UseENSNameProps {
  owner: `0x${string}` | undefined;
}

const resolveAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'resolver',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const nodeAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'node',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const;

const nameAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useENSName({ owner }: UseENSNameProps) {
  // 1️⃣ Fetch owner address, explicitly on our client
  // 2️⃣ ReverseRegistrar.node()
  const {
    data: node,
    isPending: nodeLoading,
    error: nodeError,
  } = useReadContract({
    address: constants.ReverseRegistrar,
    abi: nodeAbi,
    functionName: 'node',
    args: owner ? [owner] : undefined,
  });

  const { data: resolverResponse, isPending: resolverLoading } = useReadContract({
    abi: resolveAbi,
    functionName: 'resolver',
    address: constants.Registry,
    args: node ? [node] : undefined,
  });

  const resolver = useMemo(() => {
    if (!resolverLoading && resolverResponse) {
      return resolverResponse as `0x${string}`;
    } else {
      return '' as `0x${string}`;
    }
  }, [resolverLoading, resolverResponse]);

  // 3️⃣ PublicResolver.name()
  const {
    data: resolvedName,
    isPending: nameLoading,
    error: nameError,
  } = useReadContract({
    address: resolver,
    abi: nameAbi,
    functionName: 'name',
    args: node ? [node] : undefined,
  });

  return {
    address: owner,
    name: resolvedName as string | undefined,
    loading: nodeLoading || nameLoading,
    error: nodeError || nameError,
  };
}
