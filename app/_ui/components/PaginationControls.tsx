import { HStack, Button, Text } from "@chakra-ui/react";
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";

type PaginationControlsProps = {
  currentPage: number;
  onPrevious?: () => void;
  onNext?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
  containerBg?: string;
};

export default function PaginationControls({
  currentPage,
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
  containerBg = "gray.200",
}: PaginationControlsProps) {
  return (
    <HStack width="100%" height="6%" bg={containerBg} justify="center">
      <Button
        width="1%"
        height="60%"
        bg="#F1D803"
        onClick={onPrevious}
        isDisabled={!canPrevious}
        colorScheme="teal">
        <ArrowBackIcon width={4} height={4} color="black" />
      </Button>
      <Text>{currentPage}</Text>
      <Button
        width="1%"
        height="60%"
        bg="#F1D803"
        onClick={onNext}
        isDisabled={!canNext}
        colorScheme="teal">
        <ArrowForwardIcon width={4} height={4} color="black" />
      </Button>
    </HStack>
  );
}
