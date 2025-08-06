"use client";
import React, { useEffect, useState } from "react";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Button,
  List,
  ListItem,
  HStack,
  IconButton,
  Text,
  VStack,
  Spacer,
  useToast,
  FormErrorMessage,
} from "@chakra-ui/react";
//import { Edit2, Trash2 } from 'lucide-react';
import {
  selectEmails,
  insertEmails,
  upsertEmails,
  deleteEmails,
} from "@lib/database/email_recipients"; // ajusta la ruta según tu estructura
import { BsTrash } from "react-icons/bs";
import { MdEdit } from "react-icons/md";

export default function EmailListModal({ isOpen, onClose }) {
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const toast = useToast();

  // Carga inicial
  useEffect(() => {
    if (isOpen) fetchEmails();
  }, [isOpen]);

  async function fetchEmails() {
    try {
      const data = await selectEmails();
      setEmails(data || []);
    } catch (error) {
      console.error(error);
      toast({ title: "Error al cargar correos", status: "error" });
    }
  }

  // Agregar o editar
  const handleSave = async () => {
    if (!currentEmail) return;
    try {
      if (editingId) {
        await upsertEmails({ id: editingId, email: currentEmail });
        toast({ title: "Correo actualizado", status: "success" });
      } else {
        await insertEmails({ email: currentEmail });
        toast({ title: "Correo agregado", status: "success" });
      }
      setCurrentEmail("");
      setEditingId(null);
      fetchEmails();
    } catch (error) {
      console.error(error);
      toast({ title: "Error al guardar", status: "error" });
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setCurrentEmail(item.email);
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmails(id);
      toast({ title: "Correo eliminado", status: "info" });
      fetchEmails();
    } catch (error) {
      console.error(error);
      toast({ title: "Error al eliminar", status: "error" });
    }
  };

  const handleClose = () => {
    setCurrentEmail("");
    setEditingId(null);
    onClose();
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = (email) => emailRegex.test(email);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Gestionar Correos</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl
              isInvalid={currentEmail !== "" && !isValidEmail(currentEmail)}>
              <FormLabel>
                {editingId ? "Editar correo" : "Nuevo correo"}
              </FormLabel>
              <HStack>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
                  title="Debe tener el formato usuario@dominio.ext"
                />
                <Button
                  colorScheme="teal"
                  onClick={handleSave}
                  isDisabled={!isValidEmail(currentEmail)}>
                  {editingId ? "Actualizar" : "Agregar"}
                </Button>
              </HStack>
              <FormErrorMessage>
                Ingresa un email válido (usuario@dominio.ext)
              </FormErrorMessage>
            </FormControl>

            <Text fontWeight="bold">Correos actuales:</Text>
            <List spacing={2} maxH="300px" overflowY="auto">
              {emails.map((item) => (
                <ListItem key={item.id}>
                  <HStack>
                    <Text>{item.email}</Text>
                    <Spacer />
                    <IconButton
                      size="sm"
                      aria-label="Editar correo"
                      backgroundColor="#F1D803"
                      icon={<MdEdit size={16} />}
                      onClick={() => handleEdit(item)}
                    />
                    <IconButton
                      size="sm"
                      backgroundColor="#F1D803"
                      aria-label="Eliminar correo"
                      icon={<BsTrash size={16} />}
                      onClick={() => handleDelete(item.id)}
                    />
                  </HStack>
                </ListItem>
              ))}
            </List>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button backgroundColor="red" color="white" onClick={handleClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
