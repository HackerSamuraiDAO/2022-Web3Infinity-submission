import { Box, Button, Stack } from "@chakra-ui/react";
import React from "react";

import config from "../../../config.json";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";

export const Main: React.FC = () => {
  return (
    <Box
      boxShadow={"base"}
      borderRadius="2xl"
      p="4"
      backgroundColor={config.styles.background.color.main}
    >
      <Stack spacing="4">
        <ConnectWalletWrapper variant="outline">
          <Button
            w="full"
            variant={"outline"}
            rounded={config.styles.button.rounded}
            size={config.styles.button.size}
            fontSize={config.styles.button.fontSize}
          >
            build something valuable
          </Button>
        </ConnectWalletWrapper>
      </Stack>
    </Box>
  );
};
