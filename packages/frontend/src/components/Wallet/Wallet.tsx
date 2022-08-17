import { Box, Button, IconButton, Stack, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { HiOutlineLogout } from "react-icons/hi";
import { useAccount, useDisconnect } from "wagmi";

import config from "../../../config.json";
import { getFromLocalStorageTxList, truncate } from "../../lib/utils";
import { Modal } from "../Modal";

export const Wallet: React.FC = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [txList, setTxList] = React.useState<string[]>([]);

  const openMyWalletModal = () => {
    const txList = getFromLocalStorageTxList();
    setTxList(txList);
    onOpen();
  };

  return (
    <Box>
      <Stack direction={"row"}>
        <Button
          width="full"
          rounded={config.styles.button.rounded}
          size={config.styles.button.size}
          fontSize={config.styles.button.fontSize}
          color={config.styles.text.color.primary}
          onClick={openMyWalletModal}
        >
          {truncate(address, 6, 6)}
        </Button>
        <IconButton
          aria-label="disconnect"
          icon={<HiOutlineLogout />}
          rounded={config.styles.button.rounded}
          size={config.styles.button.size}
          onClick={() => disconnect()}
        />
      </Stack>
      <Modal onClose={onClose} isOpen={isOpen} header="Tx status">
        <Box>
          {txList.length > 0 ? (
            <Stack>
              {txList.map((tx, i) => {
                return (
                  <Text key={`tx_${i}`} fontSize={"xs"}>
                    {truncate(tx, 24)}...
                  </Text>
                );
              })}
            </Stack>
          ) : (
            <Text fontSize={"xs"}>No bridge tx yet...</Text>
          )}
        </Box>
      </Modal>
    </Box>
  );
};
