import { Box, Button, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { useAccount, useDisconnect } from "wagmi";

import config from "../../../config.json";
import { truncate } from "../../lib/utils";
import { Modal } from "../Modal";

export const Wallet: React.FC = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box>
      <Button
        width="full"
        rounded={config.styles.button.rounded}
        size={config.styles.button.size}
        fontSize={config.styles.button.fontSize}
        color={config.styles.text.color.primary}
        onClick={onOpen}
      >
        {truncate(address, 6, 6)}
      </Button>
      <Modal onClose={onClose} isOpen={isOpen} header="My Wallet">
        <Button
          width="full"
          variant={"outline"}
          rounded={config.styles.button.rounded}
          size={config.styles.button.size}
          fontSize={config.styles.button.fontSize}
          color={config.styles.text.color.primary}
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </Modal>
    </Box>
  );
};
