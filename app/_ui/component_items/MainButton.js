import { Button, HStack, Tooltip, useMediaQuery } from "@chakra-ui/react";

const useScreenSize = () => {
  const [isSmallScreen] = useMediaQuery("(max-width: 768px)");
  const [isMediumScreen] = useMediaQuery(
    "(min-width: 768px) and (max-width: 1024px)",
  );
  const [isLargeScreen] = useMediaQuery("(min-width: 1024px)");

  if (isSmallScreen) return "Pequeña";
  if (isMediumScreen) return "Mediana";
  if (isLargeScreen) return "Grande";
};

const MainButton = ({
  onClick,
  text,
  icon,
  backgroundColor = "#F1D803",
  isDisabled,
  showRightBox,
  isScreenSmall,
  MenuL,
}) => {
  const screenSize = useScreenSize();

  return (
    <Tooltip label={text} fontSize={isScreenSmall ? "sm" : "md"}>
      <Button
        onClick={onClick}
        width={
          screenSize === "Pequeña" ? "2px"
          : screenSize === "Mediana" ?
            "20px"
          : "100%"
        }
        height={
          screenSize === "Pequeña" ? "30px"
          : screenSize === "Mediana" ?
            "40px"
          : "40px"
        }
        display="block"
        whiteSpace="normal"
        colorScheme={screenSize === "Pequeña" ? "transparent" : "white"}
        backgroundColor={isDisabled ? "gray.300" : backgroundColor}
        transition="width 0.3s ease-in-out"
        isDisabled={isDisabled}>
        <HStack justify="center">
          {!showRightBox && !isScreenSmall && !MenuL && (
            <p style={{ width: "95%" }} className="font-semibold text-black">
              {text}
            </p>
          )}
          {icon}
        </HStack>
      </Button>
    </Tooltip>
  );
};

export default MainButton;
