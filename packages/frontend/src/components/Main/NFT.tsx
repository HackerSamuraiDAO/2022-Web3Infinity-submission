import { Box, Image, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import React from "react";

import { NFT as NFTType } from "../../types/nft";

export interface NFTProps {
  nft: NFTType;
  onClick?: () => void;
}

export const NFT: React.FC<NFTProps> = ({ nft, onClick }) => {
  return (
    <LinkBox cursor={onClick ? "pointer" : ""}>
      <LinkOverlay onClick={onClick}>
        <Image
          src={nft.metadata.image}
          alt={nft.metadata.name}
          height="40"
          width="40"
          fallbackSrc="/img/utils/placeholder.png"
          fit="cover"
          mb="2"
        />
        <Box textAlign={"center"}>
          <Text fontSize="xs" noOfLines={1}>
            {nft.metadata.name ? nft.metadata.name : ""}
          </Text>
        </Box>
      </LinkOverlay>
    </LinkBox>
  );
};
