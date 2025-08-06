import React, { useState } from "react";
import {
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  VStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { selectProfiles } from "@/app/_lib/database/profiles";

interface ResetPasswordModalProps {
  onClose: () => void; // Prop para cerrar el modal
  // Puedes pasar una función para validar el correo
  validateEmail: (email: string) => Promise<boolean>;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState(""); // Estado para el correo
  const [password, setPassword] = useState(""); // Estado para la nueva contraseña
  const [confirmPassword, setConfirmPassword] = useState(""); // Estado para confirmar la contraseña
  const [emailError, setEmailError] = useState(""); // Error del correo
  const [passwordError, setPasswordError] = useState(""); // Error de la contraseña
  const [confirmPasswordError, setConfirmPasswordError] = useState(""); // Error de confirmar contraseña
  const toast = useToast();

  const validateEmail = async (eemail: string) => {
    try {
      // Limpiamos los espacios de ambos valores
      const cleanedEmail = eemail.trim();

      // Suponiendo que `selectProfiles` devuelve un array de perfiles
      const correo = await selectProfiles({ limit: 10, page: 1, equals: {} });

      // Busca el objeto con el email proporcionado
      const encontrado = correo.find((perfil) => perfil.email === cleanedEmail);

      // Verifica si el correo fue encontrado
      if (encontrado) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error al validar el correo:", error);
      return false;
    }
  };

  const handleSubmit = async () => {
    let valid = true;
    // Validación del correo
    if (!email) {
      setEmailError("El correo es obligatorio.");
      valid = false;
    } else {
      const emailExists = await validateEmail(email);
      if (!emailExists) {
        setEmailError("El correo no está registrado.");
        valid = false;
      } else {
        setEmailError("");
      }
    }

    // Validación de la contraseña
    if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      valid = false;
    } else {
      setPasswordError("");
    }

    // Validación de la confirmación de contraseña
    if (confirmPassword !== password) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
      valid = false;
    } else {
      setConfirmPasswordError("");
    }

    // Si todas las validaciones son correctas, mostramos el mensaje de éxito
    if (valid) {
      toast({
        title: "Contraseña restablecida",
        description: "Tu contraseña se ha restablecido correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose(); // Cerrar el modal
    } else {
      toast({
        title: "Error",
        description: "Verifica los campos e intenta nuevamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent>
        <ModalHeader>Restablecer Contraseña</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Campo para el correo */}
            <FormControl isInvalid={!!emailError}>
              <FormLabel>Correo Electrónico</FormLabel>
              <Input
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                focusBorderColor="blue.500"
              />
              {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
            </FormControl>

            {/* Campo para la nueva contraseña */}
            <FormControl isInvalid={!!passwordError}>
              <FormLabel>Contraseña</FormLabel>
              <Input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                focusBorderColor="blue.500"
              />
              {passwordError && (
                <FormErrorMessage>{passwordError}</FormErrorMessage>
              )}
            </FormControl>

            {/* Campo para confirmar la nueva contraseña */}
            <FormControl isInvalid={!!confirmPasswordError}>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <Input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                focusBorderColor="blue.500"
              />
              {confirmPasswordError && (
                <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button bgColor="red" textColor="white" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            bgColor="#F1D803"
            textColor="black"
            onClick={handleSubmit}
            ml={3}>
            Restablecer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ResetPasswordModal;
