import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Select,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import React from "react";
import { VscArrowSwap } from "react-icons/vsc";
import { useAccount } from "wagmi";

import { ChainId, isChainId } from "../../../../shared/types/network";
import config from "../../../config.json";
import { NFT as NFTType } from "../../types/nft";
import { ConnectWalletWrapper } from "../ConnectWalletWrapper";
import { Modal } from "../Modal";
import { NetworkSelectOptions } from "./NetworkSelectOptions";
import { NFT } from "./NFT";

export const Main: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [sourceChainId, setSourceChainId] = React.useState<ChainId>("4");
  const [targetChainId, setTargetChainId] = React.useState<ChainId>("5");

  const [nfts, setNFTs] = React.useState<NFTType[]>([]);
  const [selectedNFT, setSelectedNFT] = React.useState<NFTType>();

  const [isLoading, setIsLoading] = React.useState(false);
  const { address } = useAccount();

  const bridge = () => {
    console.log("bridge");
  };

  const swapChainId = () => {
    setSelectedNFT(undefined);
    setSourceChainId(targetChainId);
    setTargetChainId(sourceChainId);
  };

  const openSelectNFTModal = async () => {
    if (!address) {
      return;
    }
    setIsLoading(true);
    const { data } = await axios.post("/api/nft", {
      chainId: sourceChainId,
      address,
    });
    if (data.length) {
      setNFTs(data);
      onOpen();
    } else {
      console.log("no nft detected");
    }
    setIsLoading(false);
  };

  const handleSourceChainIdChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const inputValue = e.target.value;
    if (!isChainId(inputValue)) {
      return;
    }
    setSelectedNFT(undefined);
    if (inputValue === targetChainId) {
      setTargetChainId(sourceChainId);
    }
    setSourceChainId(inputValue);
  };

  const handleTargetChainIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const inputValue = e.target.value;
    if (!isChainId(inputValue)) {
      return;
    }
    setSelectedNFT(undefined);
    if (inputValue === sourceChainId) {
      setSourceChainId(targetChainId);
    }
    setTargetChainId(inputValue);
  };

  const handleNFTSelected = (index: number) => {
    setSelectedNFT(nfts[index]);
    onClose();
  };

  return (
    <Box boxShadow={"base"} borderRadius="2xl" p="4" backgroundColor={config.styles.background.color.main}>
      <Stack spacing="4">
        <HStack justify={"space-between"} align="center">
          <VStack w="full">
            <Text fontSize="sm" fontWeight={"bold"} textAlign="center" color={config.styles.text.color.primary}>
              Source ChainId
            </Text>
            <Select
              variant={"filled"}
              onChange={handleSourceChainIdChange}
              value={sourceChainId}
              rounded={"2xl"}
              size="lg"
              fontSize={"sm"}
            >
              <NetworkSelectOptions />
            </Select>
          </VStack>
          <IconButton
            color="gray.800"
            onClick={swapChainId}
            aria-label="swap"
            icon={<VscArrowSwap size="12px" />}
            background="white"
            rounded="full"
            size="xs"
            variant={"outline"}
          />
          <VStack w="full">
            <Text fontSize="sm" fontWeight={"bold"} textAlign="center" color={config.styles.text.color.primary}>
              Target ChainId
            </Text>
            <Select
              variant={"filled"}
              onChange={handleTargetChainIdChange}
              value={targetChainId}
              rounded={"2xl"}
              size="lg"
              fontSize={"sm"}
            >
              <NetworkSelectOptions />
            </Select>
          </VStack>
        </HStack>
        {selectedNFT && (
          <Flex justify={"center"} p="4">
            <NFT nft={selectedNFT} />
          </Flex>
        )}
        <ConnectWalletWrapper variant="outline">
          <HStack>
            {!selectedNFT ? (
              <Button
                w="full"
                variant={"outline"}
                rounded={config.styles.button.rounded}
                size={config.styles.button.size}
                fontSize={config.styles.button.fontSize}
                onClick={openSelectNFTModal}
                isLoading={isLoading}
                loadingText="Loading NFT"
              >
                Select NFT
              </Button>
            ) : (
              <Button
                w="full"
                variant={"outline"}
                rounded={config.styles.button.rounded}
                size={config.styles.button.size}
                fontSize={config.styles.button.fontSize}
                onClick={bridge}
              >
                Bridge
              </Button>
            )}
          </HStack>
          <Modal isOpen={isOpen} onClose={onClose} header="Select NFT">
            <Flex justify={"center"}>
              <SimpleGrid columns={2} gap={8}>
                {nfts.map((nft, i) => {
                  return <NFT nft={nft} key={i} onClick={() => handleNFTSelected(i)} />;
                })}
              </SimpleGrid>
            </Flex>
          </Modal>
        </ConnectWalletWrapper>
      </Stack>
    </Box>
  );
};
